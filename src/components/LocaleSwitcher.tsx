'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()

  function switchLocale() {
    const newLocale = locale === 'en' ? 'tr' : 'en'
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <button
      onClick={switchLocale}
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
