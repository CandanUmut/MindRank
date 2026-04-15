import type { Metadata } from 'next'
import './[locale]/globals.css'

export const metadata: Metadata = {
  title: 'MindRank',
  description:
    'A quiz platform with multiple categories — from mathematics and logic to emotional intelligence. Sign in, challenge yourself, and track your growth.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
