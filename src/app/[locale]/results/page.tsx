'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/routing'
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
  quiz_type_id: string | null
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
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500">Loading results...</p></div>}>
      <ResultsContent />
    </Suspense>
  )
}

function ResultsContent() {
  const t = useTranslations('results')
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchResults() {
      const url = sessionId
        ? `/api/quiz/results?session_id=${sessionId}`
        : '/api/quiz/results'

      const res = await fetch(url)

      if (res.status === 401) {
        router.replace('/auth/login')
        return
      }
      if (res.status === 404) {
        setError(t('noCompleted'))
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
  }, [router, sessionId, t])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">{t('title')}...</p>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-gray-700 mb-4">{error ?? 'Something went wrong.'}</p>
          <Link href="/" className="text-blue-600 hover:underline">{t('takeAnother')}</Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t('quizCompleted')} &middot; {results.answers.length} {results.answers.length === 1 ? 'question' : 'questions'}
          </p>
        </div>

        <ResultSummary session={results.session} ranking={results.ranking} />
        <CategoryBreakdown categories={results.category_performance} />
        <QuestionReview answers={results.answers} />

        <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-gray-200">
          {results.session.quiz_type_id && (
            <Link
              href={`/leaderboard?quiz_type_id=${results.session.quiz_type_id}`}
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-sm"
            >
              {t('viewLeaderboard')}
            </Link>
          )}
          <Link href="/" className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm">
            {t('takeAnother')}
          </Link>
          <Link href="/profile" className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 text-sm">
            {t('viewProfile')}
          </Link>
        </div>
      </div>
    </main>
  )
}
