import { useEffect, useRef } from 'react'
import { useGamificationStore } from '../stores/gamificationStore'

export function useSectionTracker(sectionId: string, achievementId: string) {
  const ref = useRef<HTMLElement>(null)
  const unlock = useGamificationStore(s => s.unlock)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          unlock(achievementId)
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [achievementId, unlock])

  return { ref, id: sectionId }
}
