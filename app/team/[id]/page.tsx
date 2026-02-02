'use client'

import { useState } from 'react'
import { getTeamWithMembers, selectFairWinner, recordWinner } from '@/lib/fair-selection'
import type { Team, Member } from '@/types/sanity'
import Image from 'next/image'

export default async function TeamPage({ params }: { params: { id: string } }) {
  const team = await getTeamWithMembers(params.id)

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Team not found
          </h1>
          <a href="/" className="text-purple-600 hover:underline">
            Go back
          </a>
        </div>
      </div>
    )
  }

  return <TeamDashboard team={team} />
}

function TeamDashboard({ team }: { team: Team }) {
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Member | null>(null)

  async function handleSpin() {
    setSpinning(true)
    setWinner(null)

    // Simulate spin animation (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Select fair winner
    const selected = await selectFairWinner(team._id)

    if (selected) {
      await recordWinner(selected._id)
      setWinner(selected)
    }

    setSpinning(false)
  }

  return (
    <div className="min-h-screen" style={getBackgroundStyle(team)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              {team.description && (
                <p className="text-gray-600 mt-1">{team.description}</p>
              )}
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
              <div
                className={`mb-8 relative ${
                  spinning ? 'animate-pulse' : ''
                }`}
              >
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

              {!winner && team.minimumGapDays && (
                <p className="mt-4 text-gray-600 text-sm">
                  Fair selection: Minimum {team.minimumGapDays} days between wins
                </p>
              )}

              {winner && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎊 Congratulations to {winner.name}!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Total wins: {winner.totalWins + 1}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Members List */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Team Members ({team.members.length})
            </h2>
            <div className="space-y-3">
              {team.members.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  isWinner={winner?._id === member._id}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberCard({ member, isWinner }: { member: Member; isWinner: boolean }) {
  return (
    <div
      className={`flex items-center p-3 rounded-lg ${
        isWinner ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
      }`}
    >
      {member.avatar ? (
        <Image
          src={member.avatar.asset._ref}
          alt={member.name}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
          {member.name.charAt(0)}
        </div>
      )}
      <div className="ml-3 flex-1">
        <p className="font-medium text-gray-900">{member.name}</p>
        <p className="text-sm text-gray-500">{member.totalWins || 0} wins</p>
      </div>
      {isWinner && <span className="text-2xl">👑</span>}
    </div>
  )
}

function getBackgroundStyle(team: Team): React.CSSProperties {
  switch (team.backgroundType) {
    case 'image':
      return {
        backgroundImage: `url(${team.backgroundImage?.asset._ref})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    case 'video':
      return {
        backgroundColor: '#000',
      }
    case 'color':
    default:
      return {
        backgroundColor: team.backgroundColor || '#f3f4f6',
      }
  }
}
