'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface QuizType {
  id: string
  slug: string
  name_en: string
  description_en: string
  icon: string
  category_group: string
  question_count: number
  time_limit_seconds: number
  sort_order: number
}

interface UserProfile {
  display_name: string
  avatar_url: string | null
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()

      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser && !currentUser.is_anonymous) {
        setUser({ id: currentUser.id, email: currentUser.email })

        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', currentUser.id)
          .single()

        if (profileData) {
          setProfile(profileData as UserProfile)
        }
      }

      const { data: types } = await supabase
        .from('quiz_types')
        .select('id, slug, name_en, description_en, icon, category_group, question_count, time_limit_seconds, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      if (types) {
        setQuizTypes(types as QuizType[])
      }

      setLoading(false)
    }

    init()
  }, [])

  async function handleStartQuiz(quizType: QuizType) {
    if (!user) {
      router.push('/auth/login?redirect=/')
      return
    }

    setStarting(quizType.id)

    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_type_id: quizType.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      setStarting(null)
      return
    }

    sessionStorage.setItem('quiz_session_id', data.session_id)
    sessionStorage.setItem('quiz_questions', JSON.stringify(data.questions))
    sessionStorage.setItem('quiz_answered_count', String(data.answered_count ?? 0))
    sessionStorage.setItem('quiz_type_slug', quizType.slug)
    sessionStorage.setItem('quiz_type_name', quizType.name_en)
    sessionStorage.setItem('quiz_time_limit', String(quizType.time_limit_seconds))

    router.push('/quiz')
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const groupLabel: Record<string, string> = {
    mixed: 'Mixed',
    'single-domain': 'Focused',
    specialized: 'Specialized',
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    )
  }

  const quickQuiz = quizTypes.find((qt) => qt.slug === 'quick-10')
  const otherQuizzes = quizTypes.filter((qt) => qt.slug !== 'quick-10')

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MindRank</h1>
            <p className="text-gray-500 mt-1">
              Discover what you know. Learn what you don&apos;t.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                <a
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      getInitials(profile.display_name)
                    )}
                  </span>
                  <span className="hidden sm:inline font-medium">
                    {profile.display_name}
                  </span>
                </a>
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    setUser(null)
                    setProfile(null)
                    router.refresh()
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <a
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Sign In
                </a>
                <a
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Quick Quiz Banner */}
        {quickQuiz && (
          <button
            onClick={() => handleStartQuiz(quickQuiz)}
            disabled={starting === quickQuiz.id}
            className="w-full mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-left hover:border-blue-400 transition-colors group disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{quickQuiz.icon}</span>
                <div>
                  <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {quickQuiz.name_en}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    Short on time?
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {quickQuiz.question_count} questions &middot; {formatTime(quickQuiz.time_limit_seconds)}
              </div>
            </div>
          </button>
        )}

        {/* Quiz Grid */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Quiz</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherQuizzes.map((qt) => (
            <button
              key={qt.id}
              onClick={() => handleStartQuiz(qt)}
              disabled={starting === qt.id}
              className="p-5 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:shadow-sm transition-all group disabled:opacity-60"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl flex-shrink-0">{qt.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 leading-tight">
                    {qt.name_en}
                  </h3>
                  <span className="text-xs text-gray-400 mt-0.5 inline-block">
                    {groupLabel[qt.category_group] ?? qt.category_group}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {qt.description_en}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{qt.question_count} questions</span>
                <span>&middot;</span>
                <span>{formatTime(qt.time_limit_seconds)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
