export function formatCountdown(remainingMs) {
  const total = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${hours}h ${minutes}m ${seconds}s`
}