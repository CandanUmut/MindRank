'use client'

import { useEffect, useRef, useState } from 'react'

interface TimerProps {
  durationSeconds: number
  onExpire: () => void
}

export default function Timer({ durationSeconds, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)

  // Keep the callback ref current without restarting the interval.
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpireRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isLow = timeLeft <= 5 * 60 // warn when under 5 minutes

  return (
    <div
      aria-label={`Time remaining: ${minutes} minutes ${seconds} seconds`}
      aria-live="off"
      className={`font-mono text-lg font-semibold tabular-nums ${
        isLow ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
