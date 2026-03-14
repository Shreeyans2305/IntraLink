import { useEffect, useRef } from 'react'

export function useInfiniteScroll({ onLoadMore, enabled = true, threshold = 0.2 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!enabled || !ref.current) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore?.()
        }
      },
      { threshold },
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [enabled, onLoadMore, threshold])

  return ref
}