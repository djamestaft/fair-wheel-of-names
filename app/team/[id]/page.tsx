import { getTeamWithMembers } from '@/lib/fair-selection'

export default async function TeamPage({ params }: { params: { id: string } }) {
  let team = null

  try {
    team = await getTeamWithMembers(params.id)
  } catch (error) {
    console.error('Failed to fetch team:', error)
  }

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

import TeamDashboard from './TeamDashboard'
