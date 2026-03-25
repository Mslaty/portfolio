import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Code2, Menu, X, Globe, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGamificationStore } from '../stores/gamificationStore'
import { useThemeStore } from '../stores/themeStore'

export default function Navbar() {
  const { pathname, hash } = useLocation()
  const { t, i18n } = useTranslation()
  const unlock = useGamificationStore(s => s.unlock)
  const { theme, toggle: toggleTheme } = useThemeStore()
  const isHome = pathname === '/'
  const [open, setOpen] = useState(false)

  const toggleLang = () => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); unlock('switch_lang') }
  const handleTheme = () => { toggleTheme(); unlock('switch_theme') }

  const navLinks = isHome
    ? [
        { href: '#proyectos', label: t('nav.projects'), active: hash === '#proyectos' },
        { href: '#sobre-mi', label: t('nav.about'), active: hash === '#sobre-mi' },
        { href: '#contacto', label: t('nav.contact'), active: hash === '#contacto' },
      ]
    : [{ href: '/', label: t('nav.home'), active: false }]

  return (
    <>
      <nav className="sticky top-0 z-50 hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white hover:text-accent transition-colors no-underline">
          <Code2 size={22} /> <span className="hidden sm:inline">Matías Suárez</span><span className="sm:hidden">MS</span>
        </Link>

        <button onClick={() => setOpen(!open)} className="text-muted hover:text-white transition-colors p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-0 mr-4 w-56 bg-card border border-border rounded-xl shadow-xl py-2 z-50">
            {navLinks.map(l => (
              l.href.startsWith('#') ? (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition-colors no-underline ${l.active ? 'text-accent bg-accent-glow' : 'text-muted hover:text-white hover:bg-white/[0.03]'}`}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} to={l.href} onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition-colors no-underline ${l.active ? 'text-accent bg-accent-glow' : 'text-muted hover:text-white hover:bg-white/[0.03]'}`}>
                  {l.label}
                </Link>
              )
            ))}
            <Link to="/ocr" onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm transition-colors no-underline ${pathname === '/ocr' ? 'text-accent bg-accent-glow' : 'text-muted hover:text-white hover:bg-white/[0.03]'}`}>
              {t('nav.ocr_demo')}
            </Link>
            <div className="border-t border-border my-1" />
            <button onClick={() => { handleTheme(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/[0.03] transition-colors">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {theme === 'dark' ? (i18n.language === 'es' ? 'Modo claro' : 'Light mode') : (i18n.language === 'es' ? 'Modo oscuro' : 'Dark mode')}
            </button>
            <button onClick={() => { toggleLang(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/[0.03] transition-colors">
              <Globe size={14} /> {t('nav.language')}
            </button>
          </div>
        )}
      </nav>

      {open && <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setOpen(false)} />}
    </>
  )
}
