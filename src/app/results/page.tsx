'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResultSummary from '@/components/ResultSummary'
import CategoryBreakdown from '@/components/CategoryBreakdown'
import QuestionReview from '@/components/QuestionReview'
import type { AnswerWithQuestion, CategoryPerformance } from '@/lib/utils/scoring'

interface SessionData {
  id: string
  score: number
  max_score: number
  percentage: number
  time_spent_seconds: number
  status: string
}

interface RankingData {
  my_score: number
  my_rank: number
  my_percentile: number
  total_participants: number
}

interface ResultsData {
  session: SessionData
  answers: AnswerWithQuestion[]
  category_performance: CategoryPerformance[]
  ranking: RankingData | null
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      const res = await fetch('/api/quiz/results')

      if (res.status === 401) {
        router.replace('/')
        return
      }
      if (res.status === 404) {
        setError('No completed quiz found. Take the quiz first.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError('Failed to load results. Please refresh.')
        setLoading(false)
        return
      }

      const data: ResultsData = await res.json()
      setResults(data)
      setLoading(false)
    }

    fetchResults()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading results…</p>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-gray-700 mb-4">{error ?? 'Something went wrong.'}</p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Results</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Quiz completed · {results.answers.length} questions
          </p>
        </div>

        <ResultSummary session={results.session} ranking={results.ranking} />
        <CategoryBreakdown categories={results.category_performance} />
        <QuestionReview answers={results.answers} />

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-200">
          <a
            href="/leaderboard"
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
          >
            View Leaderboard
          </a>
          <a
            href="/"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm"
          >
            Home
          </a>
        </div>
      </div>
    </main>
  )
}
