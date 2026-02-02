'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  wins: number
  lastWinDate?: Date
}

export default function TeamPage({ params }: { params: { id: string } }) {
  return <TeamDashboard teamId={params.id} />
}

function TeamDashboard({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Member[]>(
    teamId === 'demo'
      ? [
          { id: '1', name: 'Alice', wins: 2 },
          { id: '2', name: 'Bob', wins: 5 },
          { id: '3', name: 'Charlie', wins: 3 },
          { id: '4', name: 'Diana', wins: 1 },
          { id: '5', name: 'Eve', wins: 4 },
          { id: '6', name: 'Frank', wins: 2 },
          { id: '7', name: 'Grace', wins: 0 },
          { id: '8', name: 'Henry', wins: 3 },
        ]
      : []
  )
  const [newMemberName, setNewMemberName] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<Member | null>(null)

  function addMember() {
    if (!newMemberName.trim()) return

    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      wins: 0,
    }

    setMembers([...members, newMember])
    setNewMemberName('')
  }

  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id))
  }

  function selectFairWinner() {
    if (members.length === 0) {
      alert('Add some team members first!')
      return null
    }

    const now = new Date()
    const minGapDays = 7

    const candidates = members
      .map((member) => {
        const daysSinceLastWin = member.lastWinDate
          ? Math.floor((now.getTime() - member.lastWinDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        if (daysSinceLastWin < minGapDays) {
          return null
        }

        return {
          member,
          daysSinceLastWin,
          weight: daysSinceLastWin,
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    if (candidates.length === 0) {
      alert('No eligible team members - everyone won recently!')
      return null
    }

    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
    let random = Math.random() * totalWeight

    let selected = candidates[0].member
    for (const candidate of candidates) {
      random -= candidate.weight
      if (random <= 0) {
        selected = candidate.member
        break
      }
    }

    return selected
  }

  async function handleSpin() {
    const selected = selectFairWinner()
    if (!selected) return

    setSpinning(true)
    setWinner(null)

    const segmentAngle = 360 / members.length
    const memberIndex = members.findIndex((m) => m.id === selected.id)
    const targetAngle = memberIndex * segmentAngle
    const spins = 5 + Math.random() * 2
    const totalRotation = spins * 360 + targetAngle

    const duration = 4000
    const startTime = Date.now()
    const startRotation = rotation

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      setRotation(startRotation + (totalRotation * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setWinner(selected)

        const updatedMembers = members.map((m) =>
          m.id === selected.id
            ? { ...m, lastWinDate: new Date(), wins: m.wins + 1 }
            : m
        )
        setMembers(updatedMembers)
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {teamId === 'demo' ? 'Demo Team' : 'Team Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                Fair spin wheel - no repeat winners for 7 days
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center">
              <div className="relative mb-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-black border-t-[40px] border-t-transparent transform rotate-180"></div>
                </div>

                <div
                  className="relative w-80 h-80 mx-auto rounded-full shadow-2xl overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'none' : 'transform 0.3s ease-out',
                  }}
                >
                  <SpinningWheel members={members} />
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
              </div>

              <button
                onClick={handleSpin}
                disabled={spinning || members.length === 0}
                className="w-full px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {spinning ? 'Spinning...' : '🎲 Spin Wheel!'}
              </button>

              {!winner && members.length > 0 && !spinning && (
                <p className="mt-4 text-gray-600 text-sm">
                  Fair selection: Each segment = {Math.round(360 / members.length)}°
                </p>
              )}

              {winner && !spinning && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎊 Congratulations to {winner.name}!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Total wins: {winner.wins}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Team Members ({members.length})
            </h2>

            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMember()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add team member..."
                />
                <button
                  onClick={addMember}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isWinner={winner?.id === member.id}
                  onRemove={() => removeMember(member.id)}
                />
              ))}
            </div>

            {members.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No members yet. Add some names above!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SpinningWheel({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="w-80 h-80 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-lg">Add members first</span>
      </div>
    )
  }

  const colors = [
    '#8B5CF6', '#F472B6', '#3B82F6', '#EF4444',
    '#F59E0B', '#10B981', '#EC4899', '#6366F1',
    '#8B5CF6', '#F472B6', '#3B82F6', '#EF4444',
  ]

  const segmentAngle = 360 / members.length
  const radius = 50

  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {members.map((member, index) => {
          const angle = index * segmentAngle
          const color = colors[index % colors.length]
          const startAngleRad = (angle - 90) * (Math.PI / 180)
          const endAngleRad = (angle + segmentAngle - 90) * (Math.PI / 180)
          const x1 = 50 + radius * Math.cos(startAngleRad)
          const y1 = 50 + radius * Math.sin(startAngleRad)
          const x2 = 50 + radius * Math.cos(endAngleRad)
          const y2 = 50 + radius * Math.sin(endAngleRad)
          const largeArcFlag = segmentAngle > 180 ? 1 : 0
          const midAngleRad = startAngleRad + (endAngleRad - startAngleRad) / 2
          const textX = 50 + (radius / 2) * Math.cos(midAngleRad)
          const textY = 50 + (radius / 2) * Math.sin(midAngleRad)
          const textRotation = angle + segmentAngle / 2
          const pathData = `M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`

          return (
            <g key={member.id}>
              <path d={pathData} fill={color} stroke="white" strokeWidth="2" />
              <text
                x={textX.toFixed(2)}
                y={textY.toFixed(2)}
                fill="white"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textRotation} ${textX.toFixed(2)} ${textY.toFixed(2)})`}
              >
                {member.name.length > 8 ? member.name.slice(0, 7) + '..' : member.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function MemberCard({
  member,
  isWinner,
  onRemove,
}: {
  member: Member
  isWinner: boolean
  onRemove: () => void
}) {
  return (
    <div
      className={`flex items-center p-3 rounded-lg ${
        isWinner ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="ml-3 flex-1">
        <p className="font-medium text-gray-900">{member.name}</p>
        <p className="text-sm text-gray-500">{member.wins} wins</p>
      </div>
      <button
        onClick={onRemove}
        className="ml-2 text-red-500 hover:text-red-700 transition-colors"
        title="Remove member"
      >
        ×
      </button>
      {isWinner && <span className="text-2xl ml-2">👑</span>}
    </div>
  )
}
