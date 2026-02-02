'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [memberNames, setMemberNames] = useState('')

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()

    if (!teamName.trim()) return

    // For now, show instructions
    alert(
      'To create teams and members:\n\n1. Go to Sanity Studio at /admin\n2. Create Members first\n3. Then create a Team and add members\n\nDirect API integration coming soon!'
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Fair Wheel of Names - Admin
          </h1>
          <a
            href="/"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Team
          </h2>

          <form onSubmit={handleCreateTeam} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Marketing Standup Team"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of this team"
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-4">
                To add team members, please use the{' '}
                <a href="/admin" className="text-purple-600 hover:underline">
                  Sanity Studio
                </a>
                . This provides full control over members, settings, and theme
                customization.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Quick Start Guide:
                </h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Go to /admin to open Sanity Studio</li>
                  <li>Create Members first (name, optional avatar)</li>
                  <li>Create a Team and add members to it</li>
                  <li>Customize theme (colors, backgrounds, music)</li>
                  <li>Set minimum gap days between wins</li>
                </ol>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Open Sanity Studio
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
