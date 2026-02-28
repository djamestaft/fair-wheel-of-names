'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { client } from '@/lib/sanity'

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
  currentPrize?: string
  wheelCenterImage?: { asset?: { url: string } }
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
  const [participants, setParticipants] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<Member | null>(null)
  const [draggedMember, setDraggedMember] = useState<Member | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [respinning, setRespinning] = useState(false)
  const [respinMessage, setRespinMessage] = useState('')

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
          currentPrize,
          wheelCenterImage{asset->{url}},
          members[]->{_id, name, avatar, lastWinDate, totalWins}
        }`,
        { teamId }
      )

      if (data) {
        setTeam(data)
        setMembers(data.members || [])
        setParticipants(data.members || [])
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
    if (participants.length === 0) {
      alert('No participants selected! Drag members into the participants list.')
      return null
    }

    const minGapDays = team?.minimumGapDays || 7

    const candidates = participants
      .map((member) => {
        const daysSinceLastWin = getDaysSinceLastWin(member.lastWinDate)

        // Exclude if won within minimum gap, UNLESS they won exactly yesterday (1 day)
        // Yesterday's winner stays in pool but triggers re-spin
        if (daysSinceLastWin < minGapDays && daysSinceLastWin > 1) {
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

  // Drag and drop handlers
  function handleDragStart(member: Member, source: 'members' | 'participants') {
    setDraggedMember({ ...member, source } as Member & { source: string })
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDropOnParticipants(e: React.DragEvent) {
    e.preventDefault()
    if (!draggedMember) return

    const source = (draggedMember as any).source
    if (source === 'members') {
      // Add to participants if not already there
      if (!participants.find(p => p._id === draggedMember._id)) {
        setParticipants([...participants, draggedMember])
      }
    } else if (source === 'participants') {
      // Already in participants, do nothing or reorder
    }
    setDraggedMember(null)
  }

  function handleDropOnMembers(e: React.DragEvent) {
    e.preventDefault()
    if (!draggedMember) return

    const source = (draggedMember as any).source
    if (source === 'participants') {
      // Remove from participants
      setParticipants(participants.filter(p => p._id !== draggedMember._id))
    }
    setDraggedMember(null)
  }

  function addAllToParticipants() {
    setParticipants([...members])
  }

  function removeAllParticipants() {
    setParticipants([])
  }

  async function handleResetStats() {
    setResetting(true)
    try {
      const res = await fetch('/api/reset-team-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })

      if (!res.ok) throw new Error('Failed to reset stats')

      // Reset local state
      const resetMembers = members.map(m => ({ ...m, lastWinDate: undefined, totalWins: 0 }))
      setMembers(resetMembers)
      setParticipants(participants.map(p => ({ ...p, lastWinDate: undefined, totalWins: 0 })))
      setWinner(null)
      setShowResetConfirm(false)
    } catch (err) {
      console.error('Failed to reset stats:', err)
      alert('Failed to reset stats')
    } finally {
      setResetting(false)
    }
  }

  // Leaderboard: members sorted by total wins
  const leaderboard = [...members].sort((a, b) => (b.totalWins || 0) - (a.totalWins || 0))

  // Check if someone won yesterday (within last 24-48 hours)
  function isYesterdaysWinner(member: Member): boolean {
    if (!member.lastWinDate) return false
    const daysSince = getDaysSinceLastWin(member.lastWinDate)
    return daysSince <= 1
  }

  // Find who won yesterday
  const yesterdaysWinner = members.find(isYesterdaysWinner)

  async function handleSpin(isRespin = false) {
    const selected = selectFairWinner()
    if (!selected) return

    // Check if we need to respin (yesterday's winner selected)
    if (!isRespin && yesterdaysWinner && selected._id === yesterdaysWinner._id) {
      // Show respin message
      setRespinMessage(`${selected.name} won yesterday! Auto re-spinning for fairness...`)
      setRespinning(true)

      // Short delay before respin
      await new Promise(resolve => setTimeout(resolve, 1500))

      setRespinMessage('')
      setRespinning(false)

      // Recursively call handleSpin with isRespin=true to skip the check
      handleSpin(true)
      return
    }

    setSpinning(true)
    setWinner(null)

    const segmentAngle = 360 / participants.length
    const memberIndex = participants.findIndex((m) => m._id === selected._id)

    // === SEGMENT LAYOUT ===
    // SVG draws segments clockwise from top (12 o'clock):
    // - Member 0: segment 0° to segmentAngle° (e.g., 0° to 90° for 4 members)
    // - Member i: segment (i * segmentAngle)° to ((i+1) * segmentAngle)°
    // - Member i's center: (i * segmentAngle + segmentAngle/2)° clockwise from top

    const winnerSegmentCenter = memberIndex * segmentAngle + segmentAngle / 2

    // === ROTATION CALCULATION ===
    // CSS rotate(Xdeg) rotates clockwise.
    // After rotating by R degrees clockwise, what was at angle θ is now at (θ + R) mod 360.
    //
    // To bring winner's segment center to the top (0°):
    //   (winnerSegmentCenter + R) mod 360 = 0
    //   R mod 360 = (360 - winnerSegmentCenter) mod 360
    const targetRotationMod360 = (360 - winnerSegmentCenter) % 360

    // Debug: verify rotation math
    console.log('=== SPIN DEBUG ===')
    console.log('Winner:', selected.name, '| Index:', memberIndex)
    console.log('Segment center:', winnerSegmentCenter, '° from top')
    console.log('Target rotation mod 360:', targetRotationMod360, '°')
    console.log('Verify: (center + target) % 360 =', (winnerSegmentCenter + targetRotationMod360) % 360, '(should be 0)')

    // Calculate how much to rotate from current position
    const currentMod360 = rotation % 360
    const minSpins = 5
    const extraSpins = Math.floor(Math.random() * 3) // 0, 1, or 2 extra full rotations

    // Delta to get from current angle to target (always positive, 0-359)
    let delta = targetRotationMod360 - currentMod360
    if (delta <= 0) {
      delta += 360
    }

    // Total rotation = current absolute rotation + full spins + delta to target
    const totalRotation = rotation + (minSpins + extraSpins) * 360 + delta

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
        setRotation(totalRotation)
        setSpinning(false)
        console.log('Final rotation:', totalRotation, '| mod 360:', totalRotation % 360, '(should match target:', targetRotationMod360 + ')')
        setWinner(selected)

        if (selected) {
          const winTime = new Date().toISOString()
          const updateMember = (m: Member) =>
            m._id === selected._id
              ? { ...m, lastWinDate: winTime, totalWins: (m.totalWins || 0) + 1 }
              : m

          setMembers(prev => prev.map(updateMember))
          setParticipants(prev => prev.map(updateMember))

          // Save win to CMS
          fetch('/api/record-win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: selected._id }),
          }).catch((err) => {
            console.error('Failed to record winner:', err)
          })

          // Show winner celebration modal
          setShowWinnerModal(true)
        }
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-3 py-2 bg-purple-600/50 text-purple-200 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                title="View leaderboard"
              >
                🏆 Leaderboard
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2 bg-red-600/30 text-red-300 rounded-lg hover:bg-red-600/50 transition-colors text-sm"
                title="Reset all stats"
              >
                🔄 Reset
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Teams
              </Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spinning Wheel - Left */}
          <div className="lg:col-span-5">
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-gray-700">
              <div className="relative mb-6">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-white border-t-[32px] border-t-transparent transform rotate-180"></div>
                </div>

                <div
                  className="relative w-80 h-80 mx-auto rounded-full shadow-2xl overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'none' : 'transform 0.3s ease-out',
                  }}
                >
                  <SpinningWheel members={participants} />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gray-900 shadow-lg flex items-center justify-center border-2 border-gray-600 overflow-hidden">
                    {team?.wheelCenterImage?.asset?.url ? (
                      <img
                        src={team.wheelCenterImage.asset.url}
                        alt="Wheel center"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🎯</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSpin()}
                disabled={spinning || respinning || participants.length === 0}
                className="w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {respinning ? '🔄 Re-spinning...' : spinning ? 'Spinning...' : '🎲 Spin Wheel!'}
              </button>

              {/* Respin message */}
              {respinning && respinMessage && (
                <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-600 rounded-lg animate-pulse">
                  <p className="text-yellow-300 text-sm text-center">{respinMessage}</p>
                </div>
              )}

              {!winner && participants.length > 0 && !spinning && !respinning && (
                <p className="mt-4 text-gray-400 text-sm">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} • Each segment = {Math.round(360 / participants.length)}°
                </p>
              )}

              {winner && !spinning && !respinning && (
                <button
                  onClick={() => setShowWinnerModal(true)}
                  className="mt-6 w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all cursor-pointer"
                >
                  <p className="text-white font-bold text-lg">
                    🎊 {winner.name} won!
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    Click to see details
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Participants - Middle */}
          <div className="lg:col-span-3">
            <div
              className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-700 h-full min-h-[500px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={handleDropOnParticipants}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">
                  Participants ({participants.length})
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={addAllToParticipants}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    title="Add all"
                  >
                    All
                  </button>
                  <button
                    onClick={removeAllParticipants}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                    title="Remove all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 border-2 border-dashed border-gray-600 rounded-lg p-2 min-h-[200px]">
                {participants.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-3xl mb-2">👆</p>
                    <p className="text-sm">Drag members here to add them to the spin</p>
                  </div>
                )}
                {participants.map((member) => (
                  <DraggableMemberCard
                    key={member._id}
                    member={member}
                    isWinner={winner?._id === member._id}
                    minGapDays={team?.minimumGapDays || 7}
                    source="participants"
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>

              <p className="text-gray-500 text-xs mt-2 text-center">
                Drop zone for spin participants
              </p>
            </div>
          </div>

          {/* All Team Members - Right */}
          <div className="lg:col-span-4">
            <div
              className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-700 h-full min-h-[500px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={handleDropOnMembers}
            >
              <h2 className="text-lg font-bold text-white mb-3">
                Team Members ({members.length})
              </h2>

              <div className="flex-1 overflow-y-auto space-y-2 border-2 border-dashed border-gray-600 rounded-lg p-2 min-h-[200px]">
                {members.map((member) => {
                  const isParticipant = participants.some(p => p._id === member._id)
                  return (
                    <DraggableMemberCard
                      key={member._id}
                      member={member}
                      isWinner={winner?._id === member._id}
                      minGapDays={team?.minimumGapDays || 7}
                      source="members"
                      onDragStart={handleDragStart}
                      isParticipant={isParticipant}
                    />
                  )
                })}
              </div>

              {members.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No members yet. Add some in Sanity Studio!
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-700">
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

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLeaderboard(false)}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🏆 Leaderboard
                </h2>
                <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
              </div>
              <div className="space-y-2">
                {leaderboard.map((member, index) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const medal = medals[index] || `#${index + 1}`
                  return (
                    <div key={member._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl w-8 text-center">{medal}</span>
                        <span className="text-white font-medium">{member.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-400 font-bold">{member.totalWins || 0}</span>
                        <span className="text-gray-500 text-sm ml-1">wins</span>
                      </div>
                    </div>
                  )
                })}
                {leaderboard.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No members yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowResetConfirm(false)}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-700" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-2">Reset All Stats?</h2>
              <p className="text-gray-400 mb-6">
                This will clear all win counts and last win dates for {members.length} team members. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStats}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={resetting}
                >
                  {resetting ? 'Resetting...' : 'Reset All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Winner Celebration Modal */}
        {showWinnerModal && winner && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowWinnerModal(false)}>
            <style jsx>{`
              @keyframes fall {
                0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              @keyframes scaleIn {
                0% { transform: scale(0.8); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-fall { animation: fall 3s linear infinite; }
              .animate-scale-in { animation: scaleIn 0.3s ease-out; }
            `}</style>
            <div
              className="bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-purple-500 animate-scale-in relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-fall"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                      backgroundColor: ['#FBBF24', '#F472B6', '#8B5CF6', '#34D399', '#60A5FA'][i % 5],
                    }}
                  />
                ))}
              </div>

              <div className="text-center relative z-10">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-white/20">
                  {winner.avatar?.asset?.url ? (
                    <img
                      src={winner.avatar.asset.url}
                      alt={winner.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    winner.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Congratulations */}
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎊 Congratulations! 🎊
                </h2>
                <p className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  {winner.name}
                </p>

                {/* Prize */}
                {team?.currentPrize && (
                  <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-lg p-4 mb-4 border border-yellow-500/50">
                    <p className="text-yellow-300 text-sm font-medium">🎁 You won:</p>
                    <p className="text-white text-xl font-bold">{team.currentPrize}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">{(winner.totalWins || 0) + 1}</p>
                    <p className="text-gray-400 text-sm">Total Wins</p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SpinningWheel({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="w-80 h-80 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        <span className="text-gray-400 text-lg">No participants</span>
      </div>
    )
  }

  const colors = [
    '#8B5CF6', '#F472B6', '#3B82F6', '#EF4444',
    '#F59E0B', '#10B981', '#EC4899', '#6366F1',
    '#14B8A6', '#F97316', '#84CC16', '#06B6D4',
  ]

  const segmentAngle = 360 / members.length
  const radius = 50

  // Dynamic sizing based on number of segments
  const segmentCount = members.length
  const fontSize = segmentCount <= 6 ? 8 : segmentCount <= 10 ? 6 : segmentCount <= 16 ? 5 : 4
  const maxChars = segmentCount <= 6 ? 10 : segmentCount <= 10 ? 6 : segmentCount <= 16 ? 4 : 2
  // Position text at 60-70% from center for better spacing
  const textRadiusPercent = segmentCount <= 6 ? 0.55 : segmentCount <= 10 ? 0.6 : 0.65

  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <style>{`
            .wheel-text {
              font-family: system-ui, -apple-system, sans-serif;
              fill: white;
              font-weight: 600;
            }
          `}</style>
        </defs>
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
          const midAngleDeg = angle + segmentAngle / 2
          const midAngleRad = (midAngleDeg - 90) * (Math.PI / 180)
          const pathData = `M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`

          // Format name based on available space
          let displayName = member.name
          if (displayName.length > maxChars) {
            if (maxChars <= 2) {
              displayName = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            } else {
              displayName = displayName.slice(0, maxChars - 1) + '..'
            }
          }

          // Position text further from center to avoid crowding
          const textX = 50 + radius * textRadiusPercent * Math.cos(midAngleRad)
          const textY = 50 + radius * textRadiusPercent * Math.sin(midAngleRad)

          // Rotate text to follow the segment direction (tangent to circle)
          let textRotation = midAngleDeg + 90

          // Keep text right-side up
          if (textRotation > 90 && textRotation < 270) {
            textRotation += 180
          }

          return (
            <g key={member._id}>
              <path d={pathData} fill={color} stroke="white" strokeWidth="1" />
              <text
                x={textX.toFixed(2)}
                y={textY.toFixed(2)}
                className="wheel-text"
                fontSize={fontSize}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textRotation} ${textX.toFixed(2)} ${textY.toFixed(2)})`}
              >
                {displayName}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function DraggableMemberCard({
  member,
  isWinner,
  minGapDays,
  source,
  onDragStart,
  isParticipant,
}: {
  member: Member
  isWinner: boolean
  minGapDays: number
  source: 'members' | 'participants'
  onDragStart: (member: Member, source: 'members' | 'participants') => void
  isParticipant?: boolean
}) {
  const daysSinceWin = member.lastWinDate
    ? Math.ceil((Date.now() - new Date(member.lastWinDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const isEligible = daysSinceWin >= minGapDays

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', member._id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart(member, source)
  }

  return (
    <div
      draggable={!isWinner}
      onDragStart={handleDragStart}
      className={`flex items-center p-2 rounded-lg transition-all ${
        isWinner
          ? 'bg-gray-800/80 border border-gray-600 opacity-50 cursor-not-allowed'
          : 'cursor-grab active:cursor-grabbing ' + (
            source === 'participants'
              ? 'bg-purple-900/30 border border-purple-500/50 hover:bg-purple-900/50'
              : isParticipant
              ? 'bg-gray-700/50 border border-purple-500/30 opacity-60'
              : 'bg-gray-700/50 hover:bg-gray-600/50'
          )
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
        isWinner ? 'bg-gray-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="ml-2 flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isWinner ? 'text-gray-400' : 'text-white'}`}>{member.name}</p>
        <p className="text-xs text-gray-500">
          {member.totalWins || 0}w
          {isWinner && <span className="ml-1 text-gray-400">(just won)</span>}
          {!isWinner && !isEligible && (
            <span className="ml-1 text-yellow-500">
              ({minGapDays - daysSinceWin}d)
            </span>
          )}
        </p>
      </div>
      {isWinner && <span className="text-xl ml-1 opacity-50">👑</span>}
      {isEligible && !isWinner && <span className="text-green-400 text-xs">✓</span>}
      {!isWinner && source === 'members' && isParticipant && (
        <span className="text-purple-400 text-xs ml-1">in</span>
      )}
    </div>
  )
}
