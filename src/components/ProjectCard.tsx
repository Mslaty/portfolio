import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  tag: string
  title: string
  description: string
  tech: string[]
  demoPath?: string
  externalUrl?: string
}

export default function ProjectCard({ tag, title, description, tech, demoPath, externalUrl }: Props) {
  return (
    <div className="group bg-card border border-border rounded-xl p-5 transition-all hover:bg-card-hover hover:border-accent hover:shadow-[0_0_20px_var(--color-accent-glow)] hover:-translate-y-0.5">
      <span className="inline-block text-[0.7rem] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-accent-glow text-accent mb-3">
        {tag}
      </span>
      <h3 className="text-[1.1rem] font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tech.map(t => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-muted border border-border">
            {t}
          </span>
        ))}
      </div>
      {(demoPath || externalUrl) && (
        <div className="flex gap-2 mt-4">
          {demoPath && (
            <Link to={demoPath} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors no-underline">
              Probar demo
            </Link>
          )}
          {externalUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-white hover:bg-white/5 transition-colors no-underline">
              <ExternalLink size={14} /> Ver
            </a>
          )}
        </div>
      )}
    </div>
  )
}
