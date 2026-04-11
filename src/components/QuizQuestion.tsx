'use client'

import { useState } from 'react'

interface Option {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

interface Question {
  id: string
  question_text: string
  options: Option[]
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  time_seconds: number
}

interface QuizQuestionProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  onAnswer: (label: 'A' | 'B' | 'C' | 'D') => Promise<void>
  disabled?: boolean
}

const difficultyColor: Record<string, string> = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800',
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled = false,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSelect(label: 'A' | 'B' | 'C' | 'D') {
    if (selected || submitting || disabled) return
    setSelected(label)
    setSubmitting(true)
    await onAnswer(label)
  }

  const isBlocked = !!selected || submitting || disabled

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      {/* Progress + meta */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
          {question.category}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded ${difficultyColor[question.difficulty] ?? 'bg-gray-100 text-gray-700'}`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-none"
          style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question text */}
      <p className="text-xl font-medium text-gray-900 mb-8 leading-relaxed">
        {question.question_text}
      </p>

      {/* Answer options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const isChosen = selected === option.label
          return (
            <button
              key={option.label}
              onClick={() => handleSelect(option.label)}
              disabled={isBlocked}
              className={`w-full text-left px-5 py-4 rounded-lg border-2 font-normal text-gray-900
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${
                  isChosen
                    ? 'border-blue-600 bg-blue-50'
                    : isBlocked
                      ? 'border-gray-200 bg-white opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50 cursor-pointer'
                }`}
            >
              <span className="inline-block w-7 font-semibold text-blue-700">
                {option.label}.
              </span>
              {option.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
