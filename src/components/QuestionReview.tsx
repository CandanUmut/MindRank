'use client'

import { useState } from 'react'
import { getOptionText } from '@/lib/utils/scoring'
import type { AnswerWithQuestion } from '@/lib/utils/scoring'

interface QuestionReviewProps {
  answers: AnswerWithQuestion[]
}

function ReviewRow({ answer }: { answer: AnswerWithQuestion }) {
  const { question, selected_answer, is_correct, number } = answer
  const [open, setOpen] = useState(!is_correct)

  if (!question) {
    return (
      <tr className="border-b border-gray-100">
        <td className="px-4 py-3 text-gray-400">{number}</td>
        <td className="px-4 py-3 text-gray-400" colSpan={4}>
          Question data unavailable
        </td>
      </tr>
    )
  }

  const selectedText = selected_answer
    ? getOptionText(question, selected_answer)
    : 'Not answered'
  const correctText = getOptionText(question, question.correct_answer)

  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <td className="px-4 py-3 text-gray-500 tabular-nums">{number}</td>
        <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
          {question.category}
        </td>
        <td className="px-4 py-3 text-gray-800 max-w-xs truncate">
          {question.question_text}
        </td>
        <td className="px-4 py-3 text-center">
          {is_correct ? (
            <span className="text-green-600 font-bold text-base" aria-label="Correct">
              ✓
            </span>
          ) : (
            <span className="text-red-500 font-bold text-base" aria-label="Incorrect">
              ✗
            </span>
          )}
        </td>
      </tr>
      {open && (
        <tr className={`${is_correct ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
          <td colSpan={4} className="px-4 py-4">
            <div className="space-y-2 text-sm">
              {is_correct ? (
                <p className="text-green-700 font-medium">You got this right!</p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-gray-600">Your answer: </span>
                    <span className="text-red-700">{selectedText}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Correct answer: </span>
                    <span className="text-green-700">{correctText}</span>
                  </p>
                </>
              )}
              <p className="text-gray-700 leading-relaxed">
                <span className="font-medium">Explanation: </span>
                {question.explanation}
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function QuestionReview({ answers }: QuestionReviewProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Question Review
        <span className="ml-2 text-sm font-normal text-gray-500">
          (click any question to see the explanation)
        </span>
      </h2>
      <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-gray-200">
              <th className="px-4 py-3 font-medium text-gray-600">#</th>
              <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                Category
              </th>
              <th className="px-4 py-3 font-medium text-gray-600">Question</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-center">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {answers.map((a) => (
              <ReviewRow key={a.number} answer={a} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
