'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatTime } from '@/lib/utils/scoring'

interface ProfileData {
  id: string
  display_name: string
  avatar_url: string | null
  locale: string
  total_quizzes_taken: number
  show_on_leaderboard: boolean
  created_at: string
}

interface QuizHistoryEntry {
  id: string
  quiz_name: string
  quiz_icon: string
  quiz_slug: string
  score: number
  max_score: number
  percentage: number
  time_spent_seconds: number
  status: string
  completed_at: string | null
}

interface StatsData {
  total_quizzes: number
  average_score: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch('/api/profile')
      if (res.status === 401) {
        router.replace('/auth/login?redirect=/profile')
        return
      }
      if (!res.ok) {
        setLoading(false)
        return
      }

      const data = await res.json()
      setProfile(data.profile)
      setQuizHistory(data.quiz_history)
      setStats(data.stats)
      setEditName(data.profile.display_name)
      setLoading(false)
    }
    loadProfile()
  }, [router])

  async function handleSaveName() {
    if (!editName.trim()) return
    setSaving(true)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: editName.trim() }),
    })

    if (res.ok && profile) {
      setProfile({ ...profile, display_name: editName.trim() })
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleToggleLeaderboard() {
    if (!profile) return

    const newValue = !profile.show_on_leaderboard
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show_on_leaderboard: newValue }),
    })

    if (res.ok) {
      setProfile({ ...profile, show_on_leaderboard: newValue })
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Could not load profile.</p>
          <a href="/" className="text-blue-600 hover:underline">Home</a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">Home</a>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                getInitials(profile.display_name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={50}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditName(profile.display_name)
                    }}
                    className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {profile.display_name}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-blue-600 hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-0.5">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-2xl font-bold text-blue-600">{stats.total_quizzes}</p>
                <p className="text-xs text-gray-500 mt-1">Quizzes Taken</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                <p className="text-2xl font-bold text-gray-800">{stats.average_score}%</p>
                <p className="text-xs text-gray-500 mt-1">Average Score</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard opt-out */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Show on leaderboards</p>
              <p className="text-xs text-gray-500">Your name will appear on public leaderboards</p>
            </div>
            <button
              onClick={handleToggleLeaderboard}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                profile.show_on_leaderboard ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  profile.show_on_leaderboard ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quiz History */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz History</h2>
        {quizHistory.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">No quizzes completed yet.</p>
            <a
              href="/"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
            >
              Take your first quiz
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {quizHistory.map((entry) => (
              <a
                key={entry.id}
                href={`/results?session_id=${entry.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg flex-shrink-0">{entry.quiz_icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {entry.quiz_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.completed_at
                          ? new Date(entry.completed_at).toLocaleDateString()
                          : 'Unknown date'}
                        {' · '}
                        {formatTime(entry.time_spent_seconds)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-gray-800">
                      {entry.score}/{entry.max_score}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Number(entry.percentage).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* My Created Quizzes placeholder */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Created Quizzes</h2>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              Quiz creation is coming soon. You will be able to create and share your own quizzes.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
