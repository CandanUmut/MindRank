'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: 'en' | 'tr') {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <button
      onClick={() => switchLocale(locale === 'en' ? 'tr' : 'en')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      aria-label="Switch language"
    >
      {locale === 'en' ? (
        <>🇹🇷 Türkçe</>
      ) : (
        <>🇺🇸 English</>
      )}
    </button>
  )
}
