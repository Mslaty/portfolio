import { Link, useLocation } from 'react-router-dom'
import { Home, Layers, Mail, ArrowUp, Globe, FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGamificationStore } from '../stores/gamificationStore'

export default function MobileFooter() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const unlock = useGamificationStore(s => s.unlock)
  const isHome = pathname === '/'

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const toggleLang = () => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); unlock('switch_lang') }

  const btnCls = (active?: boolean) =>
    `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors no-underline ${active ? 'text-accent' : 'text-muted hover:text-white'}`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg/90 backdrop-blur-xl border-t border-border px-2 py-1.5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center">

        {/* Home / Projects - always visible, always navigable */}
        {isHome ? (
          <a href="#proyectos" className={btnCls()}>
            <Layers size={20} />
            <span className="text-[10px]">{t('mobile_nav.projects')}</span>
          </a>
        ) : (
          <Link to="/" className={btnCls()}>
            <Home size={20} />
            <span className="text-[10px]">{t('nav.home')}</span>
          </Link>
        )}

        {/* Demos - goes to OCR from home, or shows current demo as active */}
        <Link to="/ocr" className={btnCls(pathname === '/ocr')}>
          <FlaskConical size={20} />
          <span className="text-[10px]">{t('mobile_nav.demos')}</span>
        </Link>

        {/* Contact */}
        {isHome ? (
          <a href="#contacto" className={btnCls()}>
            <Mail size={20} />
            <span className="text-[10px]">{t('mobile_nav.contact')}</span>
          </a>
        ) : (
          <Link to="/#contacto" className={btnCls()}>
            <Mail size={20} />
            <span className="text-[10px]">{t('mobile_nav.contact')}</span>
          </Link>
        )}

        {/* Language */}
        <button onClick={toggleLang} className={btnCls()}>
          <Globe size={20} />
          <span className="text-[10px]">{i18n.language === 'es' ? 'EN' : 'ES'}</span>
        </button>

        {/* Scroll top */}
        <button onClick={scrollToTop} className={btnCls()}>
          <ArrowUp size={20} />
          <span className="text-[10px]">{t('mobile_nav.top')}</span>
        </button>
      </div>
    </div>
  )
}
