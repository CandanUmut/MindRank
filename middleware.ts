import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

const PROTECTED_PATHS = ['/quiz', '/results', '/profile', '/leaderboard']

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix to check the actual path
  const pathWithoutLocale = pathname.replace(/^\/(en|tr)/, '') || '/'
  return PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes — they don't need i18n or auth redirect
  if (pathname.startsWith('/api/')) {
    // Still refresh the session for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => { request.cookies.set(name, value) })
          },
        },
      }
    )
    await supabase.auth.getUser()
    return NextResponse.next({ request })
  }

  // Run i18n middleware first to handle locale detection/redirect
  const response = intlMiddleware(request)

  // Check auth for protected paths
  if (isProtectedPath(pathname)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => { request.cookies.set(name, value) })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.is_anonymous) {
      // Detect locale from the path
      const localeMatch = pathname.match(/^\/(en|tr)/)
      const locale = localeMatch ? localeMatch[1] : 'en'
      const loginUrl = new URL(`/${locale}/auth/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
