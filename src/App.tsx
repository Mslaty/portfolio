import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from './pages/Landing'
import OcrTool from './pages/OcrTool'
import ChatDemo from './pages/ChatDemo'
import PipelineDemo from './pages/PipelineDemo'
import DashboardDemo from './pages/DashboardDemo'
import ApiDemo from './pages/ApiDemo'
import KanbanDemo from './pages/KanbanDemo'
import McpDemo from './pages/McpDemo'
import Navbar from './components/Navbar'
import MobileFooter from './components/MobileFooter'
import CookieBanner from './components/CookieBanner'
import GamificationBadge from './components/GamificationBadge'
import AchievementToasts from './components/AchievementToasts'
import Onboarding from './components/Onboarding'
import { useGamificationStore } from './stores/gamificationStore'
import { useThemeStore } from './stores/themeStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const GA_ID = ''

const DEMO_ROUTES: Record<string, string> = {
  '/ocr': 'demo_ocr',
  '/chat': 'demo_chat',
  '/pipeline': 'demo_pipeline',
  '/api': 'demo_api',
  '/dashboard': 'demo_dashboard',
  '/kanban': 'demo_kanban',
  '/mcp': 'demo_mcp',
}

function DemoTracker() {
  const location = useLocation()
  const unlock = useGamificationStore(s => s.unlock)

  useEffect(() => {
    const achievementId = DEMO_ROUTES[location.pathname]
    if (achievementId) unlock(achievementId)
  }, [location.pathname, unlock])

  return null
}

function ThemeSync() {
  const theme = useThemeStore(s => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <div className="min-h-screen pb-14 md:pb-0">
        <Navbar />
        <DemoTracker />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ocr" element={<OcrTool />} />
          <Route path="/chat" element={<ChatDemo />} />
          <Route path="/pipeline" element={<PipelineDemo />} />
          <Route path="/dashboard" element={<DashboardDemo />} />
          <Route path="/api" element={<ApiDemo />} />
          <Route path="/kanban" element={<KanbanDemo />} />
          <Route path="/mcp" element={<McpDemo />} />
          <Route path="*" element={<Landing />} />
        </Routes>
        <MobileFooter />
        <GamificationBadge />
        <AchievementToasts />
        <Onboarding />
        <CookieBanner gaId={GA_ID || undefined} />
      </div>
    </QueryClientProvider>
  )
}
