import { getTeamWithMembers } from '@/lib/fair-selection'
import type { Team } from '@/types/sanity'
import TeamDashboard from './TeamDashboard'

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
