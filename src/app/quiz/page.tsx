'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Timer from '@/components/Timer'
import QuizQuestion from '@/components/QuizQuestion'

interface Option {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

interface Question {
  id: string
  index: number
  question_text: string
  options: Option[]
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  time_seconds: number
}

const QUIZ_DURATION_SECONDS = 25 * 60 // 25 minutes

export default function QuizPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const submitQuiz = useCallback(
    async (sid: string) => {
      if (submittingRef.current) return
      submittingRef.current = true

      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      })

      // Clear quiz state from sessionStorage.
      sessionStorage.removeItem('quiz_session_id')
      sessionStorage.removeItem('quiz_questions')
      sessionStorage.removeItem('quiz_answered_count')

      router.push('/results')
    },
    [router]
  )

  useEffect(() => {
    const storedId = sessionStorage.getItem('quiz_session_id')
    const storedQuestions = sessionStorage.getItem('quiz_questions')
    const storedAnsweredCount = sessionStorage.getItem('quiz_answered_count')

    if (!storedId || !storedQuestions) {
      // No session in storage – bounce back to landing.
      router.replace('/')
      return
    }

    try {
      const parsed: Question[] = JSON.parse(storedQuestions)
      setSessionId(storedId)
      setQuestions(parsed)
      setCurrentIndex(Math.min(Number(storedAnsweredCount ?? 0), parsed.length - 1))
      setLoading(false)
    } catch {
      setLoadError('Failed to load quiz data. Please return to the home page.')
      setLoading(false)
    }
  }, [router])

  const handleAnswer = useCallback(
    async (selectedLabel: 'A' | 'B' | 'C' | 'D') => {
      if (!sessionId || submittingRef.current) return

      const question = questions[currentIndex]
      const timeTakenMs = 0 // tracked per-question start time could be added in Phase 2

      // Submit the answer to the server.
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_answer: selectedLabel,
          time_taken_ms: timeTakenMs,
        }),
      })

      const isLast = currentIndex === questions.length - 1

      if (!res.ok || isLast) {
        await submitQuiz(sessionId)
        return
      }

      const data = await res.json()
      if (data.is_last) {
        await submitQuiz(sessionId)
      } else {
        setCurrentIndex((prev) => prev + 1)
      }
    },
    [sessionId, questions, currentIndex, submitQuiz]
  )

  const handleTimerExpire = useCallback(() => {
    if (sessionId && !submittingRef.current) {
      submitQuiz(sessionId)
    }
  }, [sessionId, submitQuiz])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading quiz…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-gray-700 mb-4">{loadError}</p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  if (!question) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar: progress info + timer */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            MindRank
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {questions.length}
            </span>
            <Timer
              durationSeconds={QUIZ_DURATION_SECONDS}
              onExpire={handleTimerExpire}
            />
          </div>
        </div>
      </header>

      {/* Question */}
      <QuizQuestion
        key={question.id}
        question={question}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  )
}
