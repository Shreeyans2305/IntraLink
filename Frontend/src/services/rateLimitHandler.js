export function createRateLimitHandler({ max = 8, windowMs = 12000 } = {}) {
  let events = []

  return {
    canProceed() {
      const now = Date.now()
      events = events.filter((eventTime) => now - eventTime <= windowMs)

      if (events.length >= max) {
        return false
      }

      events.push(now)
      return true
    },
    reset() {
      events = []
    },
  }
}