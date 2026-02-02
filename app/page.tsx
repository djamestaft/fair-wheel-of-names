import Link from 'next/link'
import { getAllTeams } from '@/lib/fair-selection'
import type { Team } from '@/types/sanity'

export default async function HomePage() {
  let teams: Team[] = []

  try {
    teams = await getAllTeams()
  } catch (error) {
    console.error('Failed to fetch teams:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Fair Wheel of Names</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Team
          </h2>
          <p className="text-xl text-gray-600">
            Pick a team to spin wheel and fairly select a winner
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 mb-4">No teams yet</p>
            <Link
              href="/admin"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Team
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard key={team._id} team={team} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/team/${team._id}`}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 block"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{team.name}</h3>
      {team.description && (
        <p className="text-gray-600 mb-4">{team.description}</p>
      )}
      <div className="flex items-center text-sm text-gray-500">
        <span className="mr-4">{team.memberCount} members</span>
        <span className="text-purple-600 font-medium">Spin wheel →</span>
      </div>
    </Link>
  )
}
