import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const COOKIE_KEY = 'portfolio_cookies_consent'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function loadGtag(id: string) {
  if (!/^G-[A-Z0-9]+$/.test(id)) return
  if (document.querySelector(`script[src*="${id}"]`)) return
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  script.async = true
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

export default function CookieBanner({ gaId }: { gaId?: string }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (consent === 'accepted' && gaId) loadGtag(gaId)
    if (!consent) setVisible(true)
  }, [gaId])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    if (gaId) loadGtag(gaId)
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-14 md:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] bg-card border border-border rounded-xl p-4 shadow-xl">
      <p className="text-sm text-muted mb-3">{t('cookie.message')}</p>
      <div className="flex gap-2">
        <button onClick={accept}
          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors">
          {t('cookie.accept')}
        </button>
        <button onClick={reject}
          className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted hover:text-white hover:bg-white/5 transition-colors">
          {t('cookie.reject')}
        </button>
      </div>
    </div>
  )
}
