import { useTranslation } from 'react-i18next'
import { Trophy, X } from 'lucide-react'
import { useGamificationStore } from '../stores/gamificationStore'

export default function AchievementToasts() {
  const { toasts, dismissToast } = useGamificationStore()
  const { i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  if (!toasts.length) return null

  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 max-w-xs">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 bg-card border border-accent rounded-xl shadow-xl animate-[slideIn_0.3s_ease-out]"
        >
          <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center shrink-0">
            <Trophy size={16} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-accent">
              +{t.achievement.points} pts
            </p>
            <p className="text-sm font-medium truncate">
              {isEn ? t.achievement.labelEn : t.achievement.label}
            </p>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-muted hover:text-white transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
