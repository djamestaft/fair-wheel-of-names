import { createClient, SanityClient } from '@sanity/client'
import { NextResponse } from 'next/server'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

// Only create client if projectId is a non-empty string
let writeClient: SanityClient | null = null
if (projectId && projectId.trim().length > 0) {
  writeClient = createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    useCdn: false,
    token,
  })
}

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

    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    // Fetch all members of the team
    const team = await writeClient.fetch(
      `*[_type == "team" && _id == $teamId][0]{
        members[]->{_id}
      }`,
      { teamId }
    )

    if (!team?.members?.length) {
      return NextResponse.json(
        { error: 'No members found for this team' },
        { status: 404 }
      )
    }

    // Reset stats for all members
    const resetPromises = team.members.map((member: { _id: string }) =>
      writeClient
        .patch(member._id)
        .set({
          lastWinDate: null,
          totalWins: 0,
        })
        .commit()
    )

    await Promise.all(resetPromises)

    return NextResponse.json({
      success: true,
      resetCount: team.members.length
    })
  } catch (error) {
    console.error('Error resetting team stats:', error)
    return NextResponse.json(
      { error: 'Failed to reset team stats' },
      { status: 500 }
    )
  }
}
