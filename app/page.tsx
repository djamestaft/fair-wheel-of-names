import Link from 'next/link'
import { getAllTeams } from '@/lib/fair-selection'

export default async function HomePage() {
  let teams = []

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

        {/* Always show Demo Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DemoTeamCard />
        </div>

        {/* Sanity Teams */}
        {teams.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Sanity Teams
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          </>
        )}

        {teams.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-lg text-blue-900 mb-2">
              💡 Configure Sanity for persistent teams
            </p>
            <p className="text-blue-700 mb-4">
              Set up your Sanity project to create and manage teams
            </p>
            <Link
              href="/admin"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Configure Sanity
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function DemoTeamCard() {
  return (
    <Link
      href="/team/demo"
      className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 block text-white"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold">Demo Team</h3>
        <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
          Try it now!
        </span>
      </div>
      <p className="text-white/90 mb-4">
        Quick demo with mock names - no setup required
      </p>
      <div className="flex items-center text-sm">
        <span className="mr-4">✨ Add names instantly</span>
        <span className="font-medium">Spin wheel →</span>
      </div>
    </Link>
  )
}

function TeamCard({ team }: { team: any }) {
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
