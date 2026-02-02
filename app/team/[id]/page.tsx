'use client'

import { useState } from 'react'

interface Member {
  id: string
  name: string
  wins: number
}

export default function TeamPage({ params }: { params: { id: string } }) {
  return <TeamDashboard teamId={params.id} />
}

function TeamDashboard({ teamId }: { teamId: string }) {
  // Mock names for demo team
  const [members, setMembers] = useState<Member[]>(
    teamId === 'demo'
      ? [
          { id: '1', name: 'Alice Johnson', wins: 2 },
          { id: '2', name: 'Bob Smith', wins: 5 },
          { id: '3', name: 'Charlie Davis', wins: 3 },
          { id: '4', name: 'Diana Prince', wins: 1 },
          { id: '5', name: 'Eve Williams', wins: 4 },
          { id: '6', name: 'Frank Miller', wins: 2 },
          { id: '7', name: 'Grace Lee', wins: 0 },
          { id: '8', name: 'Henry Chen', wins: 3 },
        ]
      : []
  )
  const [newMemberName, setNewMemberName] = useState('')
  const [spinning, setSpinning] = useState(false)
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
      return
    }

    const now = new Date()
    const minGapDays = 7

    // Calculate weights and filter eligible members
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
      return
    }

    // Weighted random selection
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
    setSpinning(true)
    setWinner(null)

    // Simulate spin animation (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const selected = selectFairWinner()

    if (selected) {
      // Update winner with new date and win count
      const updatedMembers = members.map((m) =>
        m.id === selected.id
          ? { ...m, lastWinDate: new Date(), wins: m.wins + 1 }
          : m
      )
      setMembers(updatedMembers)
      setWinner(selected)
    }

    setSpinning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
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
            <a
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Teams
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Spin Area */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center">
              <div className={`mb-8 relative ${spinning ? 'animate-pulse' : ''}`}>
                {/* Visual Wheel */}
                <div className="w-80 h-80 mx-auto rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-2xl flex items-center justify-center border-8 border-white">
                  {spinning ? (
                    <span className="text-6xl">🎡</span>
                  ) : winner ? (
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white mb-2">
                        {winner.name}
                      </p>
                      <p className="text-xl text-white/80">🎉 Winner!</p>
                    </div>
                  ) : (
                    <span className="text-6xl">🎯</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSpin}
                disabled={spinning}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {spinning ? 'Spinning...' : '🎲 Spin the Wheel'}
              </button>

              {!winner && (
                <p className="mt-4 text-gray-600 text-sm">
                  Fair selection: Minimum 7 days between wins
                </p>
              )}

              {winner && (
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

          {/* Right: Members List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Team Members ({members.length})
            </h2>

            {/* Add Member Form */}
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

            {/* Members List */}
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
