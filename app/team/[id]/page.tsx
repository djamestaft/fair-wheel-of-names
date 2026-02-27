'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { client } from '@/lib/sanity'
import { recordWinner } from '@/lib/fair-selection'

interface Member {
  _id: string
  name: string
  avatar?: { asset?: { url: string } }
  lastWinDate?: string
  totalWins: number
}

interface Team {
  _id: string
  name: string
  description?: string
  minimumGapDays: number
  members: Member[]
}

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  return <TeamDashboardWrapper params={params} />
}

function TeamDashboardWrapper({ params }: { params: Promise<{ id: string }> }) {
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setTeamId(p.id))
  }, [params])

  if (!teamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return <TeamDashboard teamId={teamId} />
}

function TeamDashboard({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<Member | null>(null)

  const fetchTeam = useCallback(async () => {
    if (!client) {
      setError('Sanity client not configured')
      setLoading(false)
      return
    }

    try {
      const data = await client.fetch(
        `*[_type == "team" && _id == $teamId][0]{
          _id,
          name,
          description,
          minimumGapDays,
          members[]->{_id, name, avatar, lastWinDate, totalWins}
        }`,
        { teamId }
      )

      if (data) {
        setTeam(data)
        setMembers(data.members || [])
      } else {
        setError('Team not found')
      }
    } catch (err) {
      console.error('Error fetching team:', err)
      setError('Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  function getDaysSinceLastWin(lastWinDate: string | null | undefined): number {
    if (!lastWinDate) return 999
    const now = new Date()
    const lastWin = new Date(lastWinDate)
    const diffTime = Math.abs(now.getTime() - lastWin.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  function selectFairWinner(): Member | null {
    if (members.length === 0) {
      alert('No team members!')
      return null
    }

    const minGapDays = team?.minimumGapDays || 7

    const candidates = members
      .map((member) => {
        const daysSinceLastWin = getDaysSinceLastWin(member.lastWinDate)

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
    const memberIndex = members.findIndex((m) => m._id === selected._id)

    // The wheel has segments starting at the top (12 o'clock) going clockwise.
    // Segment i starts at (i * segmentAngle) degrees clockwise from top.
    // Segment i's center is at (i * segmentAngle + segmentAngle/2) degrees clockwise from top.
    //
    // When the wheel rotates clockwise by R degrees:
    // - What was at angle θ (from top) is now at (θ + R) mod 360
    //
    // To bring segment i's center to the top (0 degrees from top):
    // - We need (winnerSegmentCenter + R) mod 360 = 0
    // - So R mod 360 = (360 - winnerSegmentCenter) mod 360

    const winnerSegmentCenter = memberIndex * segmentAngle + segmentAngle / 2
    const targetAngle = (360 - winnerSegmentCenter) % 360 // The angle we want to end at (0-359)

    // Calculate how much to rotate from current position
    const currentAngle = rotation % 360 // Current position within 0-359
    const minSpins = 5 // Minimum number of full rotations
    const maxExtraSpins = 2 // Additional random rotations (0-2)
    const extraSpins = Math.random() * maxExtraSpins

    // Calculate the delta to reach target from current position (always positive, 0-359)
    let deltaToTarget = targetAngle - currentAngle
    if (deltaToTarget <= 0) {
      deltaToTarget += 360 // Ensure we always move forward
    }

    // Total rotation = current position + spins + delta to align exactly
    const totalRotation = rotation + (minSpins + extraSpins) * 360 + deltaToTarget

    const duration = 4000
    const startTime = Date.now()
    const startRotation = rotation

    function animate() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      setRotation(startRotation + (totalRotation - startRotation) * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Ensure we end at exactly the target rotation
        setRotation(totalRotation)
        setSpinning(false)
        setWinner(selected)

        // Update local state
        const updatedMembers = members.map((m) =>
          m._id === selected._id
            ? { ...m, lastWinDate: new Date().toISOString(), totalWins: (m.totalWins || 0) + 1 }
            : m
        )
        setMembers(updatedMembers)

        // Persist to Sanity
        recordWinner(selected._id).catch((err) => {
          console.error('Failed to record winner:', err)
        })
      }
    }

    requestAnimationFrame(animate)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading team...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Teams
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">{team?.name}</h1>
              {team?.description && (
                <p className="text-gray-400 mt-1">{team.description}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Fair spin wheel - no repeat winners for {team?.minimumGapDays || 7} days
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center border border-gray-700">
              <div className="relative mb-8">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-white border-t-[40px] border-t-transparent transform rotate-180"></div>
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

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gray-900 shadow-lg flex items-center justify-center border-2 border-gray-600">
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
                <p className="mt-4 text-gray-400 text-sm">
                  Fair selection: Each segment = {Math.round(360 / members.length)}°
                </p>
              )}

              {winner && !spinning && (
                <div className="mt-6 p-4 bg-green-900/50 border border-green-600 rounded-lg">
                  <p className="text-green-300 font-medium">
                    🎊 Congratulations to {winner.name}!
                  </p>
                  <p className="text-green-400 text-sm mt-1">
                    Total wins: {(winner.totalWins || 0) + 1}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Team Members ({members.length})
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  isWinner={winner?._id === member._id}
                  minGapDays={team?.minimumGapDays || 7}
                />
              ))}
            </div>

            {members.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No members yet. Add some in Sanity Studio!
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700">
              <Link
                href="/studio"
                className="block text-center text-purple-400 hover:text-purple-300 text-sm"
              >
                Manage members in Studio →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpinningWheel({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="w-80 h-80 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        <span className="text-gray-400 text-lg">No members</span>
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
            <g key={member._id}>
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
  minGapDays,
}: {
  member: Member
  isWinner: boolean
  minGapDays: number
}) {
  const daysSinceWin = member.lastWinDate
    ? Math.ceil((Date.now() - new Date(member.lastWinDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const isEligible = daysSinceWin >= minGapDays

  return (
    <div
      className={`flex items-center p-3 rounded-lg ${
        isWinner ? 'bg-green-900/50 border-2 border-green-500' : 'bg-gray-700/50'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="ml-3 flex-1">
        <p className="font-medium text-white">{member.name}</p>
        <p className="text-sm text-gray-400">
          {member.totalWins || 0} wins
          {!isEligible && (
            <span className="ml-2 text-yellow-500">
              (cooling off: {minGapDays - daysSinceWin}d left)
            </span>
          )}
        </p>
      </div>
      {isWinner && <span className="text-2xl ml-2">👑</span>}
      {isEligible && !isWinner && <span className="text-green-400 text-sm">✓</span>}
    </div>
  )
}
