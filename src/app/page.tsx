'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_COUNTS: { name: string; count: number }[] = [
  { name: 'General Knowledge', count: 8 },
  { name: 'Logic & Problem Solving', count: 7 },
  { name: 'Mathematics', count: 6 },
  { name: 'Physics', count: 5 },
  { name: 'Ethics & Philosophy', count: 5 },
  { name: 'Science', count: 5 },
  { name: 'Chemistry', count: 4 },
]

type SessionState = 'loading' | 'none' | 'in_progress' | 'completed'

export default function LandingPage() {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // Ensure the user has an anonymous session.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) {
          setError('Could not create a session. Please refresh the page.')
          setSessionState('none')
          return
        }
      }

      // Check for an existing quiz session.
      const res = await fetch('/api/quiz/start', { method: 'POST' })
      const data = await res.json()

      if (res.status === 409 || data.error === 'already_completed') {
        setSessionState('completed')
        return
      }

      if (res.ok && data.session_id) {
        // An in_progress session was found or just created.
        // Store session data in sessionStorage so the quiz page can resume.
        sessionStorage.setItem('quiz_session_id', data.session_id)
        sessionStorage.setItem('quiz_questions', JSON.stringify(data.questions))
        sessionStorage.setItem(
          'quiz_answered_count',
          String(data.answered_count ?? 0)
        )
        setSessionState(data.answered_count > 0 ? 'in_progress' : 'none')
        return
      }

      setSessionState('none')
    }

    init()
  }, [])

  async function handleStart() {
    setStarting(true)
    setError(null)

    // If session data isn't in sessionStorage yet (edge case), fetch it.
    if (!sessionStorage.getItem('quiz_session_id')) {
      const res = await fetch('/api/quiz/start', { method: 'POST' })
      const data = await res.json()

      if (res.status === 409 || data.error === 'already_completed') {
        router.push('/results')
        return
      }
      if (!res.ok || !data.session_id) {
        setError('Failed to start the quiz. Please try again.')
        setStarting(false)
        return
      }
      sessionStorage.setItem('quiz_session_id', data.session_id)
      sessionStorage.setItem('quiz_questions', JSON.stringify(data.questions))
      sessionStorage.setItem(
        'quiz_answered_count',
        String(data.answered_count ?? 0)
      )
    }

    router.push('/quiz')
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">MindRank</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            A timed 40-question quiz spanning seven knowledge domains — from
            mathematics and physics to ethics and general knowledge. Complete
            the quiz to receive a detailed score, a per-category breakdown, and
            your anonymous rank among all participants.
          </p>
        </div>

        {/* Quiz at a glance */}
        <div className="bg-gray-50 rounded-lg p-6 mb-10 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Quiz overview
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">40</p>
              <p className="text-xs text-gray-500 mt-1">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">25</p>
              <p className="text-xs text-gray-500 mt-1">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-xs text-gray-500 mt-1">Attempt</p>
            </div>
          </div>

          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Categories
          </h3>
          <div className="space-y-2">
            {CATEGORY_COUNTS.map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{name}</span>
                <span className="text-gray-500 tabular-nums">{count} questions</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {sessionState === 'loading' && (
          <div className="text-gray-500 text-sm">Preparing your session…</div>
        )}

        {sessionState === 'completed' && (
          <div className="space-y-4">
            <p className="text-gray-700">
              You have already completed the quiz.
            </p>
            <div className="flex gap-3">
              <a
                href="/results"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                View My Results
              </a>
              <a
                href="/leaderboard"
                className="inline-block px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                View Leaderboard
              </a>
            </div>
          </div>
        )}

        {sessionState === 'in_progress' && (
          <div className="space-y-4">
            <p className="text-gray-700">
              You have a quiz in progress. Resume where you left off.
            </p>
            <button
              onClick={handleStart}
              disabled={starting}
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {starting ? 'Loading…' : 'Resume Quiz'}
            </button>
          </div>
        )}

        {sessionState === 'none' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              No account required. Your quiz is anonymous and your score is
              private. One attempt per session.
            </p>
            <button
              onClick={handleStart}
              disabled={starting}
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {starting ? 'Starting…' : 'Start Quiz'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
