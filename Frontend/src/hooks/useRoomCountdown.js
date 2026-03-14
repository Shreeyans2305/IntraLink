import { useEffect, useMemo, useState } from 'react'

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

export function useRoomCountdown(expiresAt) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, expiresAt - Date.now()))

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs(Math.max(0, expiresAt - Date.now()))
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt])

  const formatted = useMemo(() => formatDuration(remainingMs), [remainingMs])

  return {
    remainingMs,
    formatted,
    expired: remainingMs <= 0,
  }
}