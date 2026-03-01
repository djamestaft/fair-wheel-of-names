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

    const { name, teamId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Member name is required' },
        { status: 400 }
      )
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    // Create the new member
    const newMember = await writeClient.create({
      _type: 'member',
      name: name.trim(),
      totalWins: 0,
    })

    // Add the member to the team's members array
    await writeClient
      .patch(teamId)
      .setIfMissing({ members: [] })
      .append('members', [{ _type: 'reference', _ref: newMember._id }])
      .commit()

    return NextResponse.json({
      success: true,
      member: {
        _id: newMember._id,
        name: newMember.name,
        totalWins: 0,
        lastWinDate: null,
      },
    })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}
