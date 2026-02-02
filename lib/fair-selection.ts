import { client } from './sanity'
import type { Member, Team } from '@/sanity/schemas'

export interface MemberWithWeight {
  member: Member
  daysSinceLastWin: number
  weight: number
}

/**
 * Calculate days since last win
 */
function getDaysSinceLastWin(lastWinDate: string | null): number {
  if (!lastWinDate) return 999 // Never won = highest priority

  const now = new Date()
  const lastWin = new Date(lastWinDate)
  const diffTime = Math.abs(now.getTime() - lastWin.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Fair selection algorithm
 * - Exclude anyone who won in the last X days
 * - Weight remaining candidates by days since last win
 * - Pick weighted random from eligible pool
 */
export async function selectFairWinner(
  teamId: string
): Promise<Member | null> {
  // Fetch team with all members
  const team = await client.fetch(
    `*[_type == "team" && _id == $teamId][0]{
      _id,
      name,
      minimumGapDays,
      members[]->{_id, name, avatar, lastWinDate, totalWins}
    }`,
    { teamId }
  )

  if (!team || !team.members?.length) {
    return null
  }

  const minGapDays = team.minimumGapDays || 7

  // Calculate weights and filter eligible members
  const candidates: MemberWithWeight[] = []

  for (const member of team.members) {
    const daysSinceLastWin = getDaysSinceLastWin(member.lastWinDate)

    // Exclude if won within the minimum gap
    if (daysSinceLastWin < minGapDays) {
      continue
    }

    candidates.push({
      member,
      daysSinceLastWin,
      weight: daysSinceLastWin,
    })
  }

  // If no eligible candidates, return null
  if (candidates.length === 0) {
    return null
  }

  // Weighted random selection
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let random = Math.random() * totalWeight

  for (const candidate of candidates) {
    random -= candidate.weight
    if (random <= 0) {
      return candidate.member
    }
  }

  // Fallback (shouldn't happen)
  return candidates[0].member
}

/**
 * Update member win record
 */
export async function recordWinner(
  memberId: string
): Promise<Member | null> {
  const member = await client.fetch(
    `*[_type == "member" && _id == $memberId][0]`,
    { memberId }
  )

  if (!member) return null

  const now = new Date().toISOString()

  const updated = await client
    .patch(memberId)
    .set({
      lastWinDate: now,
      totalWins: (member.totalWins || 0) + 1,
    })
    .commit()

  return updated
}

/**
 * Get team with members for display
 */
export async function getTeamWithMembers(teamId: string) {
  return client.fetch(
    `*[_type == "team" && _id == $teamId][0]{
      _id,
      name,
      description,
      minimumGapDays,
      musicEnabled,
      musicTrack,
      backgroundType,
      backgroundColor,
      backgroundImage,
      backgroundVideo,
      members[]->{_id, name, avatar, lastWinDate, totalWins}
    }`,
    { teamId }
  )
}

/**
 * Get all teams for list page
 */
export async function getAllTeams() {
  return client.fetch(
    `*[_type == "team"] | order(name asc){
      _id,
      name,
      description,
      "memberCount": count(members)
    }`
  )
}
