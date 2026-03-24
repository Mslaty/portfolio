import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, X, Sparkles, MousePointer, Trophy, Zap } from 'lucide-react'
import { useGamificationStore } from '../stores/gamificationStore'

const STEPS_ES = [
  { icon: Sparkles, title: 'Bienvenido a mi portfolio', desc: 'Aqui encontraras demos interactivas reales, no mockups. Cada proyecto es funcional.' },
  { icon: MousePointer, title: 'Explora las secciones', desc: 'Haz scroll para descubrir proyectos, arquitectura, stack y demos. Todo esta traducido ES/EN.' },
  { icon: Trophy, title: 'Sistema de logros', desc: 'Gana puntos al visitar secciones y probar demos. Sube de nivel conforme explores.' },
  { icon: Zap, title: 'Prueba las demos', desc: 'Cada demo tiene funcionalidad real: chat con IA, pipeline ETL, CRUD con roles, kanban con drag & drop.' },
]

const STEPS_EN = [
  { icon: Sparkles, title: 'Welcome to my portfolio', desc: 'Here you\'ll find real interactive demos, not mockups. Every project is functional.' },
  { icon: MousePointer, title: 'Explore the sections', desc: 'Scroll to discover projects, architecture, stack and demos. Everything is translated ES/EN.' },
  { icon: Trophy, title: 'Achievement system', desc: 'Earn points by visiting sections and trying demos. Level up as you explore.' },
  { icon: Zap, title: 'Try the demos', desc: 'Each demo has real functionality: AI chat, ETL pipeline, CRUD with roles, kanban with drag & drop.' },
]

export default function Onboarding() {
  const { i18n } = useTranslation()
  const { onboardingDone, completeOnboarding } = useGamificationStore()
  const [step, setStep] = useState(0)

  if (onboardingDone) return null

  const steps = i18n.language === 'en' ? STEPS_EN : STEPS_ES
  const current = steps[step]
  const isLast = step === steps.length - 1

  const next = () => {
    if (isLast) {
      completeOnboarding()
    } else {
      setStep(step + 1)
    }
  }

  const skip = () => completeOnboarding()

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={skip} />

      {/* Card */}
      <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        {/* Skip */}
        <button onClick={skip} className="absolute top-3 right-3 text-muted hover:text-white transition-colors">
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-accent-glow flex items-center justify-center mb-4">
          <current.icon size={24} className="text-accent" />
        </div>

        {/* Content */}
        <h2 className="text-lg font-bold mb-2">{current.title}</h2>
        <p className="text-sm text-muted leading-relaxed mb-6">{current.desc}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{step + 1}/{steps.length}</span>
          <button onClick={next}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent-hover transition-colors">
            {isLast ? (i18n.language === 'en' ? 'Start exploring' : 'Empezar a explorar') : (i18n.language === 'en' ? 'Next' : 'Siguiente')}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
