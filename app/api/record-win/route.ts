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

    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      )
    }

    // Fetch current member to get existing totalWins
    const member = await writeClient.fetch(
      `*[_type == "member" && _id == $memberId][0]{ totalWins }`,
      { memberId }
    )

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Update member with new win data
    const updated = await writeClient
      .patch(memberId)
      .set({
        lastWinDate: new Date().toISOString(),
        totalWins: (member.totalWins || 0) + 1,
      })
      .commit()

    return NextResponse.json({ success: true, member: updated })
  } catch (error) {
    console.error('Error recording win:', error)
    return NextResponse.json(
      { error: 'Failed to record win' },
      { status: 500 }
    )
  }
}
