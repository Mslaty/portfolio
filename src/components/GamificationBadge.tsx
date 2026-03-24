import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, X, ChevronUp, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react'
import {
  useGamificationStore,
  getLevel,
  getNextLevel,
  isMaxLevel,
  ACHIEVEMENTS,
  MAX_POINTS,
} from '../stores/gamificationStore'

export default function GamificationBadge() {
  const { t, i18n } = useTranslation()
  const { points, unlocked, unlock, reset } = useGamificationStore()
  const [open, setOpen] = useState(false)
  const isEn = i18n.language === 'en'

  const level = getLevel(points)
  const next = getNextLevel(points)
  const pct = Math.round((points / MAX_POINTS) * 100)
  const readyToHire = isMaxLevel(points)
  const hireClicked = unlocked.includes('hire_click')

  const mailtoHref = `mailto:msuarezlaty@gmail.com?subject=${encodeURIComponent(t('contact.email_subject'))}&body=${encodeURIComponent(t('contact.email_body'))}`

  const handleHireClick = () => {
    unlock('hire_click')
    window.location.href = mailtoHref
  }

  return (
    <>
      {/* Hire CTA - appears when max level reached */}
      {readyToHire && !hireClicked && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50 animate-[slideIn_0.5s_ease-out]">
          <button
            onClick={handleHireClick}
            className="flex items-center gap-2 px-5 py-3 bg-accent text-white font-semibold rounded-xl shadow-xl hover:bg-accent-hover transition-all hover:scale-105 text-sm"
          >
            🤝 {t('hero.cta')} <ArrowRight size={16} />
          </button>
          <span className="block text-center text-[0.6rem] text-accent mt-1">+100 pts</span>
        </div>
      )}

      {/* Floating badge */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full shadow-lg hover:border-accent transition-all"
      >
        <span className="text-base">{level.emoji}</span>
        <div className="flex flex-col items-start">
          <span className="text-[0.65rem] font-semibold text-white leading-tight">
            {isEn ? level.nameEn : level.name}
          </span>
          <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="text-[0.6rem] text-muted">{points}</span>
        <ChevronUp size={12} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="fixed bottom-32 md:bottom-16 left-4 z-50 w-72 max-h-[70vh] bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-accent" />
                <div>
                  <h3 className="text-sm font-semibold">{level.emoji} {isEn ? level.nameEn : level.name}</h3>
                  <p className="text-[0.65rem] text-muted">{points}/{MAX_POINTS} pts &middot; {pct}%</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-white"><X size={14} /></button>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 border-b border-border">
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-green-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              {next && (
                <p className="text-[0.6rem] text-muted mt-1">
                  {isEn ? `${next.minPoints - points} pts to ${next.nameEn} ${next.emoji}` : `${next.minPoints - points} pts para ${next.name} ${next.emoji}`}
                </p>
              )}
              {readyToHire && !hireClicked && (
                <button onClick={handleHireClick}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors">
                  🤝 {t('hero.cta')} (+100 pts) <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Privacy note */}
            <div className="px-4 py-2 border-b border-border flex items-start gap-2">
              <ShieldCheck size={12} className="text-green-500 shrink-0 mt-0.5" />
              <p className="text-[0.6rem] text-muted leading-relaxed">
                {isEn
                  ? 'Your progress is stored only in your browser (localStorage). No data is sent to any server.'
                  : 'Tu progreso se guarda solo en tu navegador (localStorage). No se envia ningun dato a ningun servidor.'}
              </p>
            </div>

            {/* Achievements list */}
            <div className="overflow-y-auto max-h-[35vh] p-2">
              {ACHIEVEMENTS.map(a => {
                const done = unlocked.includes(a.id)
                return (
                  <div key={a.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${done ? '' : 'opacity-40'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] font-bold ${done ? 'bg-accent text-white' : 'bg-border text-muted'}`}>
                      {done ? '✓' : '?'}
                    </span>
                    <span className="flex-1">{isEn ? a.labelEn : a.label}</span>
                    <span className="text-muted">+{a.points}</span>
                  </div>
                )
              })}
            </div>

            {/* Reset */}
            <div className="px-4 py-2 border-t border-border">
              <button onClick={() => { reset(); setOpen(false) }}
                className="flex items-center gap-1 text-[0.65rem] text-muted hover:text-white transition-colors">
                <RotateCcw size={10} /> Reset
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
