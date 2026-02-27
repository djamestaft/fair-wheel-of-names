'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { client } from '@/lib/sanity'

interface Team {
  _id: string
  name: string
  description?: string
  memberCount: number
}

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeams() {
      if (!client) {
        setError('Sanity client not configured. Please set up environment variables.')
        setLoading(false)
        return
      }

      try {
        const data = await client.fetch(
          `*[_type == "team"] | order(name asc){
            _id,
            name,
            description,
            "memberCount": count(members)
          }`
        )
        setTeams(data || [])
      } catch (err) {
        console.error('Error fetching teams:', err)
        setError('Failed to load teams. Please check your Sanity configuration.')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Fair Wheel of Names
          </h1>
          <p className="text-xl text-gray-300">
            A fair way to pick random winners - no repeat selections for 7 days
          </p>
        </header>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading teams...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-6 text-center mb-8">
            <p className="text-red-300">{error}</p>
            <p className="text-red-400 text-sm mt-2">
              Make sure NEXT_PUBLIC_SANITY_PROJECT_ID is set in your environment.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid gap-4 mb-8">
              {teams.map((team) => (
                <Link
                  key={team._id}
                  href={`/team/${team._id}`}
                  className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {team.name}
                      </h2>
                      {team.description && (
                        <p className="text-gray-400 mt-1">{team.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-400">
                        {team.memberCount}
                      </span>
                      <p className="text-gray-500 text-sm">members</p>
                    </div>
                  </div>
                </Link>
              ))}

              {teams.length === 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-gray-700">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    No Teams Yet
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Create your first team in Sanity Studio to get started.
                  </p>
                  <Link
                    href="/studio"
                    className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Open Studio
                  </Link>
                </div>
              )}
            </div>

            {teams.length > 0 && (
              <div className="text-center">
                <Link
                  href="/studio"
                  className="inline-block px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Manage Teams in Studio
                </Link>
              </div>
            )}
          </>
        )}

        <div className="mt-16 text-center">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>Each team member gets a slice of the wheel</li>
              <li>Winners cannot be selected again for 7 days</li>
              <li>Members who haven&apos;t won recently have higher chances</li>
              <li>All data persists in Sanity CMS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
