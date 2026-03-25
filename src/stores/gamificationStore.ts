import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Achievement {
  id: string
  label: string
  labelEn: string
  points: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'visit_hero', label: 'Bienvenida', labelEn: 'Welcome', points: 5 },
  { id: 'visit_ocr_section', label: 'Proyecto estrella', labelEn: 'Star project', points: 10 },
  { id: 'visit_demos', label: 'Explorador de demos', labelEn: 'Demo explorer', points: 10 },
  { id: 'visit_architecture', label: 'Arquitecto', labelEn: 'Architect', points: 10 },
  { id: 'visit_stack', label: 'Stack review', labelEn: 'Stack review', points: 10 },
  { id: 'visit_about', label: 'Conocer al dev', labelEn: 'Meet the dev', points: 10 },
  { id: 'visit_contact', label: 'Contacto', labelEn: 'Contact', points: 10 },
  { id: 'demo_ocr', label: 'Demo OCR', labelEn: 'OCR Demo', points: 20 },
  { id: 'demo_chat', label: 'Demo Chat', labelEn: 'Chat Demo', points: 20 },
  { id: 'demo_pipeline', label: 'Demo Pipeline', labelEn: 'Pipeline Demo', points: 20 },
  { id: 'demo_api', label: 'Demo API', labelEn: 'API Demo', points: 20 },
  { id: 'demo_dashboard', label: 'Demo Dashboard', labelEn: 'Dashboard Demo', points: 20 },
  { id: 'demo_kanban', label: 'Demo Kanban', labelEn: 'Kanban Demo', points: 20 },
  { id: 'demo_mcp', label: 'Demo MCP', labelEn: 'MCP Demo', points: 20 },
  { id: 'switch_lang', label: 'Poliglota', labelEn: 'Polyglot', points: 5 },
  { id: 'switch_theme', label: 'Cambio de look', labelEn: 'New look', points: 5 },
  { id: 'hire_click', label: 'Contratame!', labelEn: 'Hire me!', points: 100 },
]

export const LEVELS = [
  { name: 'Visitante', nameEn: 'Visitor', minPoints: 0, emoji: '👋' },
  { name: 'Explorador', nameEn: 'Explorer', minPoints: 30, emoji: '🔍' },
  { name: 'Interesado', nameEn: 'Interested', minPoints: 65, emoji: '🧐' },
  { name: 'Enganchado', nameEn: 'Engaged', minPoints: 105, emoji: '🔥' },
  { name: 'Convencido', nameEn: 'Convinced', minPoints: 150, emoji: '🚀' },
  { name: 'Listo para contratar', nameEn: 'Ready to hire', minPoints: 185, emoji: '🤝' },
]

const MAX_POINTS = ACHIEVEMENTS.reduce((s, a) => s + a.points, 0)

export interface ToastData {
  id: number
  achievement: Achievement
}

interface GamificationState {
  unlocked: string[]
  points: number
  onboardingDone: boolean
  toasts: ToastData[]
  unlock: (id: string) => void
  completeOnboarding: () => void
  dismissToast: (id: number) => void
  reset: () => void
}

let toastId = 0

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      points: 0,
      onboardingDone: false,
      toasts: [],

      unlock: (id: string) => {
        if (get().unlocked.includes(id)) return
        const achievement = ACHIEVEMENTS.find(a => a.id === id)
        if (!achievement) return
        const tid = ++toastId
        set(s => ({
          unlocked: [...s.unlocked, id],
          points: Math.min(s.points + achievement.points, MAX_POINTS),
          toasts: [...s.toasts, { id: tid, achievement }],
        }))
        // Auto-dismiss after 3.5s
        setTimeout(() => {
          set(s => ({ toasts: s.toasts.filter(t => t.id !== tid) }))
        }, 3500)
      },

      completeOnboarding: () => set({ onboardingDone: true }),

      dismissToast: (id: number) =>
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      reset: () => set({ unlocked: [], points: 0, onboardingDone: false, toasts: [] }),
    }),
    {
      name: 'portfolio-gamification',
      partialize: (s) => ({ unlocked: s.unlocked, points: s.points, onboardingDone: s.onboardingDone }),
    },
  ),
)

export function getLevel(points: number) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (points >= l.minPoints) level = l
  }
  return level
}

export function getNextLevel(points: number) {
  for (const l of LEVELS) {
    if (points < l.minPoints) return l
  }
  return null
}

export function isMaxLevel(points: number) {
  return points >= LEVELS[LEVELS.length - 1].minPoints
}

export { MAX_POINTS }
