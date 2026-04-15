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
  scoring_type?: string
}

export default function QuizPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [quizName, setQuizName] = useState('MindRank')
  const [timeLimit, setTimeLimit] = useState(25 * 60)
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

      const resultSessionId = sid
      sessionStorage.removeItem('quiz_session_id')
      sessionStorage.removeItem('quiz_questions')
      sessionStorage.removeItem('quiz_answered_count')
      sessionStorage.removeItem('quiz_type_slug')
      sessionStorage.removeItem('quiz_type_name')
      sessionStorage.removeItem('quiz_time_limit')

      router.push(`/results?session_id=${resultSessionId}`)
    },
    [router]
  )

  useEffect(() => {
    const storedId = sessionStorage.getItem('quiz_session_id')
    const storedQuestions = sessionStorage.getItem('quiz_questions')
    const storedAnsweredCount = sessionStorage.getItem('quiz_answered_count')
    const storedName = sessionStorage.getItem('quiz_type_name')
    const storedTimeLimit = sessionStorage.getItem('quiz_time_limit')

    if (!storedId || !storedQuestions) {
      router.replace('/')
      return
    }

    try {
      const parsed: Question[] = JSON.parse(storedQuestions)
      setSessionId(storedId)
      setQuestions(parsed)
      setCurrentIndex(Math.min(Number(storedAnsweredCount ?? 0), parsed.length - 1))
      if (storedName) setQuizName(storedName)
      if (storedTimeLimit) setTimeLimit(Number(storedTimeLimit))
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

      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_answer: selectedLabel,
          time_taken_ms: 0,
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
        <p className="text-gray-500">Loading quiz...</p>
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
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {quizName}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {questions.length}
            </span>
            <Timer
              durationSeconds={timeLimit}
              onExpire={handleTimerExpire}
            />
          </div>
        </div>
      </header>

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
