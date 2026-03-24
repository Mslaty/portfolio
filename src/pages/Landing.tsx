import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Upload, Brain, FileJson, Monitor, Database, BarChart3, Bot, Globe, Server, TestTube, Mail, Phone, MapPin } from 'lucide-react'
import { useSectionTracker } from '../hooks/useSectionTracker'

export default function Landing() {
  const { t } = useTranslation()

  const hero = useSectionTracker('hero', 'visit_hero')
  const ocrSection = useSectionTracker('ocr-project', 'visit_ocr_section')
  const demosSection = useSectionTracker('demos', 'visit_demos')
  const archSection = useSectionTracker('architecture', 'visit_architecture')
  const stackSection = useSectionTracker('stack', 'visit_stack')
  const aboutSection = useSectionTracker('about', 'visit_about')
  const contactSection = useSectionTracker('contact', 'visit_contact')

  const mailtoHref = `mailto:msuarezlaty@gmail.com?subject=${encodeURIComponent(t('contact.email_subject'))}&body=${encodeURIComponent(t('contact.email_body'))}`

  return (
    <>
      {/* ─── HERO ─── */}
      <section ref={hero.ref} className="text-center py-12 md:py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-4">{t('hero.badge')}</p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-5 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          {t('hero.title')}
        </h1>
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['React', 'Vite', 'Tailwind', 'TypeScript', 'APIs', 'WebSocket', 'AI Agents', 'Zustand', 'React Query', 'Vitest'].map(tag => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-muted border border-border">{tag}</span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href={mailtoHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-accent text-white hover:bg-accent-hover transition-colors no-underline text-base">
            {t('hero.cta')} <ArrowRight size={16} />
          </a>
          <a href="#ocr-project" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border border-border text-white hover:bg-white/5 transition-colors no-underline">
            {t('hero.cta_secondary')}
          </a>
        </div>
      </section>

      {/* ─── PROYECTO OCR ─── */}
      <section ref={ocrSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20" id="ocr-project">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('ocr_section.badge')}</p>
        <h2 className="text-2xl font-bold mb-2">{t('ocr_section.title')}</h2>
        <p className="text-muted mb-8 max-w-2xl">{t('ocr_section.subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            {[
              { icon: Upload, title: t('ocr_section.upload_title'), desc: t('ocr_section.upload_desc') },
              { icon: Brain, title: t('ocr_section.prompt_title'), desc: t('ocr_section.prompt_desc') },
              { icon: FileJson, title: t('ocr_section.parsing_title'), desc: t('ocr_section.parsing_desc') },
              { icon: Monitor, title: t('ocr_section.edit_title'), desc: t('ocr_section.edit_desc') },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <div className="text-accent mt-1"><f.icon size={20} /></div>
                <div>
                  <h3 className="text-sm font-semibold mb-0.5">{f.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">{t('ocr_section.arch_title')}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-accent font-semibold">Frontend</span>
                <p className="text-muted mt-0.5">{t('ocr_section.arch_frontend')}</p>
              </div>
              <div>
                <span className="text-accent font-semibold">AI Integration</span>
                <p className="text-muted mt-0.5">{t('ocr_section.arch_ai')}</p>
              </div>
              <div>
                <span className="text-accent font-semibold">Data flow</span>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-muted">
                  {['Upload PDF', 'Base64', 'Gemini API', 'JSON parse', 'Tabla editable', 'CSV export'].map((step, i) => (
                    <span key={step} className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-border whitespace-nowrap text-[0.65rem]">{step}</span>
                      {i < 5 && <ArrowRight size={10} className="text-muted/40 shrink-0" />}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-accent font-semibold">Testing</span>
                <p className="text-muted mt-0.5">{t('ocr_section.arch_testing')}</p>
              </div>
            </div>
          </div>
        </div>

        <Link to="/ocr" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent-hover transition-colors no-underline">
          {t('ocr_section.try_demo')} <ArrowRight size={16} />
        </Link>
      </section>

      {/* ─── DEMOS ─── */}
      <section ref={demosSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20" id="demos">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('demos.badge')}</p>
        <h2 className="text-2xl font-bold mb-6">{t('demos.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { tag: t('demos.chat_tag'), path: '/chat', title: t('demos.chat_title'), desc: t('demos.chat_desc'), tech: ['React', 'Gemini API', 'Tailwind', 'Hooks'] },
            { tag: t('demos.pipeline_tag'), path: '/pipeline', title: t('demos.pipeline_title'), desc: t('demos.pipeline_desc'), tech: ['Services layer', 'Vitest (12 tests)', 'CSV parse'] },
            { tag: t('demos.api_tag'), path: '/api', title: t('demos.api_title'), desc: t('demos.api_desc'), tech: ['Zustand', 'React Query ready', 'RBAC'] },
            { tag: t('demos.dashboard_tag'), path: '/dashboard', title: t('demos.dashboard_title'), desc: t('demos.dashboard_desc'), tech: ['React', 'useMemo', 'Charts CSS'] },
            { tag: t('demos.kanban_tag'), path: '/kanban', title: t('demos.kanban_title'), desc: t('demos.kanban_desc'), tech: ['Zustand', 'persist', 'DnD + touch'] },
          ].map(d => (
            <Link key={d.path} to={d.path} className="group bg-card border border-border rounded-xl p-5 transition-all hover:border-accent hover:shadow-[0_0_20px_var(--color-accent-glow)] hover:-translate-y-0.5 no-underline">
              <span className="inline-block text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-glow text-accent mb-2">{d.tag}</span>
              <h3 className="text-sm font-semibold text-white mb-1">{d.title}</h3>
              <p className="text-xs text-muted leading-relaxed mb-3">{d.desc}</p>
              <div className="flex flex-wrap gap-1">
                {d.tech.map(tch => <span key={tch} className="text-[0.65rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-muted border border-border">{tch}</span>)}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── ARQUITECTURA ─── */}
      <section ref={archSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('architecture.badge')}</p>
        <h2 className="text-2xl font-bold mb-6">{t('architecture.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { title: t('architecture.frontend'), color: 'text-accent', items: ['React (hooks, composition)', 'TypeScript (strict)', 'Tailwind CSS (utility-first)', 'Vite (HMR, tree-shaking)', 'React Query (async state)', 'i18next (ES/EN)'] },
            { title: t('architecture.state'), color: 'text-accent', items: ['Zustand (global state, persist)', 'Services layer (gemini.ts, pipeline.ts)', 'Custom hooks (useApiKey)', 'LLM APIs (prompt engineering)', 'WebSocket ready (real-time)'] },
            { title: t('architecture.testing'), color: 'text-accent', items: ['Vitest (23 unit tests)', 'Playwright (E2E)', 'Testing Library', 'SonarQube', 'GitHub Flow + CI/CD'] },
          ].map(col => (
            <div key={col.title} className="bg-card border border-border rounded-xl p-5">
              <h3 className={`text-sm font-semibold mb-3 ${col.color}`}>{col.title}</h3>
              <ul className="text-xs text-muted space-y-1.5">
                {col.items.map(item => <li key={item}><strong className="text-white">{item.split(' (')[0]}</strong>{item.includes('(') ? ` (${item.split('(')[1]}` : ''}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">{t('architecture.folders_title')}</h3>
          <div className="text-xs text-muted leading-relaxed space-y-0.5 font-mono">
            <p className="font-semibold text-white">src/</p>
            {[
              ['components/', 'Navbar, MobileFooter, CookieBanner, ProjectCard'],
              ['pages/', 'Landing, OcrTool, ChatDemo, PipelineDemo...'],
              ['services/', 'gemini.ts, pipeline.ts'],
              ['stores/', 'kanbanStore, apiStore (Zustand)'],
              ['hooks/', 'useApiKey'],
              ['locales/', 'es.json, en.json (i18n)'],
              ['__tests__/', 'Unit tests (Vitest, 23 tests)'],
            ].map(([folder, desc]) => (
              <p key={folder} className="flex flex-wrap gap-x-2">
                <span className="text-accent whitespace-nowrap">&nbsp;&nbsp;{folder}</span>
                <span>{desc}</span>
              </p>
            ))}
            <p className="flex flex-wrap gap-x-2 mt-1">
              <span className="font-semibold text-white">e2e/</span>
              <span>Playwright E2E tests</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── STACK ─── */}
      <section ref={stackSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 py-12" id="stack">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('stack.badge')}</p>
        <h2 className="text-xl font-semibold text-muted mb-5">{t('stack.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Frontend', icon: Globe, items: ['React (hooks, composition)', 'TypeScript (strict)', 'Tailwind CSS (utility-first)', 'Vite (HMR, tree-shaking)', 'Next.js (SSR/SSG)', 'i18next (ES/EN)'] },
            { title: 'State & Async', icon: Database, items: ['Zustand (global state)', 'React Query (server state)', 'Custom hooks', 'WebSocket (real-time)', 'REST APIs'] },
            { title: 'IA & Agents', icon: Bot, items: ['Gemini API (vision, chat)', 'Prompt engineering', 'AI chat agents', 'OCR / document parsing', 'N8N (webhooks, flows)'] },
            { title: 'Testing & QA', icon: TestTube, items: ['Vitest (unit, 23 tests)', 'Playwright (E2E)', 'Testing Library', 'SonarQube', 'GitHub Flow + CI/CD'] },
            { title: 'Backend', icon: Server, items: ['Node.js / Express', 'FastAPI / Python', 'PostgreSQL / SQLite', 'Docker', 'Ubuntu'] },
            { title: 'Data & BI', icon: BarChart3, items: ['SQL (queries, joins)', 'PowerBI (DAX, M)', 'ETL pipelines', 'CSV/JSON processing', 'Data normalization'] },
          ].map(cat => (
            <div key={cat.title} className="bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors">
              <div className="flex items-center gap-2 text-accent mb-3">
                <cat.icon size={20} />
                <h3 className="text-sm font-semibold text-white">{cat.title}</h3>
              </div>
              <ul className="text-xs text-muted space-y-1">
                {cat.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section ref={aboutSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20" id="sobre-mi">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('about.badge')}</p>
            <h2 className="text-2xl font-bold mb-4">{t('about.title')}</h2>
            <p className="text-muted text-sm leading-relaxed mb-3">{t('about.p1')}</p>
            <p className="text-muted text-sm leading-relaxed mb-3">{t('about.p2')}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 text-sm">{t('about.methodology')}</h3>
            <ul className="space-y-2">
              {[
                ['Scrum', 'Sprints, dailies, retrospectivas'],
                ['GitHub Flow', 'Feature branches, PRs, code review'],
                ['Vitest + Playwright', 'Unit + E2E testing'],
                ['SonarQube', 'Static analysis'],
                ['CI/CD', 'GitHub Actions, Docker, Vercel'],
              ].map(([title, desc]) => (
                <li key={title} className="text-xs text-muted pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent">
                  <strong className="text-white">{title}</strong> &mdash; {desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section ref={contactSection.ref} className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 scroll-mt-20" id="contacto">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">{t('contact.badge')}</p>
            <h2 className="text-2xl font-bold mb-2">{t('contact.title')}</h2>
            <p className="text-muted text-sm mb-6">{t('contact.subtitle')}</p>
            <div className="flex flex-col gap-3 mb-6">
              <a href="mailto:msuarezlaty@gmail.com" className="flex items-center gap-2.5 text-sm text-muted hover:text-accent transition-colors no-underline">
                <Mail size={18} /> msuarezlaty@gmail.com
              </a>
              <a href="tel:+34627455648" className="flex items-center gap-2.5 text-sm text-muted hover:text-accent transition-colors no-underline">
                <Phone size={18} /> 627 455 648
              </a>
              <div className="flex items-center gap-2.5 text-sm text-muted">
                <MapPin size={18} /> Las Palmas de Gran Canaria
              </div>
            </div>
            <a href={mailtoHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-accent text-white hover:bg-accent-hover transition-colors no-underline">
              <Mail size={16} /> {t('contact.request_interview')}
            </a>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 inline-flex items-center gap-2 font-medium text-sm self-start">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse-dot" />
            {t('contact.available')}
          </div>
        </div>
      </section>

      <footer className="text-center py-10 text-sm text-muted border-t border-border mt-12">
        &copy; {new Date().getFullYear()} &middot; {t('footer.copy')}
      </footer>
    </>
  )
}
