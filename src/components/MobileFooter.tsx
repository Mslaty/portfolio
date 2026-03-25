import { Link, useLocation } from 'react-router-dom'
import { Home, Layers, Mail, Globe, FlaskConical, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGamificationStore } from '../stores/gamificationStore'
import { useThemeStore } from '../stores/themeStore'

export default function MobileFooter() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const unlock = useGamificationStore(s => s.unlock)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const isHome = pathname === '/'

  const toggleLang = () => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); unlock('switch_lang') }
  const handleTheme = () => { toggleTheme(); unlock('switch_theme') }

  const btnCls = (active?: boolean) =>
    `flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-colors no-underline ${active ? 'text-accent' : 'text-muted hover:text-white'}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg/90 backdrop-blur-xl border-t border-border px-1 py-1.5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center">
        {isHome ? (
          <a href="#proyectos" className={btnCls()}>
            <Layers size={18} />
            <span className="text-[9px]">{t('mobile_nav.projects')}</span>
          </a>
        ) : (
          <Link to="/" className={btnCls()}>
            <Home size={18} />
            <span className="text-[9px]">{t('nav.home')}</span>
          </Link>
        )}

        <Link to="/ocr" className={btnCls(pathname === '/ocr')}>
          <FlaskConical size={18} />
          <span className="text-[9px]">{t('mobile_nav.demos')}</span>
        </Link>

        {isHome ? (
          <a href="#contacto" className={btnCls()}>
            <Mail size={18} />
            <span className="text-[9px]">{t('mobile_nav.contact')}</span>
          </a>
        ) : (
          <Link to="/#contacto" className={btnCls()}>
            <Mail size={18} />
            <span className="text-[9px]">{t('mobile_nav.contact')}</span>
          </Link>
        )}

        <button onClick={handleTheme} className={btnCls()}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[9px]">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <button onClick={toggleLang} className={btnCls()}>
          <Globe size={18} />
          <span className="text-[9px]">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
        </button>
      </div>
    </div>
  )
}
