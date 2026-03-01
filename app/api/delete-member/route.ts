import { createClient, SanityClient } from '@sanity/client'
import { NextResponse } from 'next/server'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

const writeClient: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2025-01-01',
      useCdn: false,
      token,
    })
  : null

export async function POST(request: Request) {
  try {
    if (!writeClient) {
      return NextResponse.json(
        { error: 'Sanity client not configured - missing NEXT_PUBLIC_SANITY_PROJECT_ID' },
        { status: 500 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'SANITY_API_TOKEN not configured' },
        { status: 500 }
      )
    }

    const { memberId, teamId } = await request.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      )
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    // Remove the member reference from the team's members array
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{ members }`,
      { teamId }
    )

    if (team?.members) {
      const updatedMembers = team.members.filter(
        (m: { _ref: string }) => m._ref !== memberId
      )

      await writeClient
        .patch(teamId)
        .set({ members: updatedMembers })
        .commit()
    }

    // Delete the member document
    await writeClient.delete(memberId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
