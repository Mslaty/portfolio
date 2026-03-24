import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Lock, Unlock, Shield, Clock, Copy, CheckCircle } from 'lucide-react'
import { useApiStore, type Product } from '../stores/apiStore'

type Role = 'admin' | 'editor' | 'viewer'
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

const ROLE_LEVEL: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 }
const METHOD_COLORS: Record<Method, string> = { GET: '#22c55e', POST: '#6c63ff', PUT: '#f59e0b', DELETE: '#ef4444' }

interface Endpoint { method: Method; path: string; desc: string; minRole: Role }

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/products', desc: 'Listar todos', minRole: 'viewer' },
  { method: 'GET', path: '/api/products/:id', desc: 'Obtener por ID', minRole: 'viewer' },
  { method: 'POST', path: '/api/products', desc: 'Crear producto', minRole: 'editor' },
  { method: 'PUT', path: '/api/products/:id', desc: 'Actualizar', minRole: 'editor' },
  { method: 'DELETE', path: '/api/products/:id', desc: 'Eliminar', minRole: 'admin' },
  { method: 'POST', path: '/api/auth/login', desc: 'Login (JWT)', minRole: 'viewer' },
]

export default function ApiDemo() {
  const { t } = useTranslation()
  const store = useApiStore()
  const [role, setRole] = useState<Role>('admin')
  const [selected, setSelected] = useState<Endpoint | null>(null)
  const [response, setResponse] = useState<{ status: number; body: object; time: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [rateCount, setRateCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [paramId, setParamId] = useState(1)
  const [bodyJson, setBodyJson] = useState('{\n  "name": "Webcam 4K",\n  "price": 120,\n  "stock": 50,\n  "category": "electronica"\n}')

  const canAccess = useCallback((ep: Endpoint) => ROLE_LEVEL[role] >= ROLE_LEVEL[ep.minRole], [role])

  const callEndpoint = async (ep: Endpoint) => {
    setSelected(ep); setLoading(true); setResponse(null)

    if (rateCount >= 20) {
      await new Promise(r => setTimeout(r, 200))
      setResponse({ status: 429, body: { error: 'Rate limit exceeded (20/min)', retry_after: 60 }, time: 5 })
      setLoading(false); return
    }

    await new Promise(r => setTimeout(r, 150 + Math.random() * 250))

    if (!canAccess(ep)) {
      setResponse({ status: 403, body: { error: 'Forbidden', message: `Rol '${role}' sin permisos para ${ep.method} ${ep.path}`, required: ep.minRole }, time: 8 })
    } else {
      let body: Partial<Product> | undefined
      if (ep.method === 'POST' || ep.method === 'PUT') {
        try { body = JSON.parse(bodyJson) } catch { body = {} }
      }

      let result: { status: number; body: object }

      if (ep.path === '/api/auth/login') {
        result = { status: 200, body: { token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: '1', role, iat: Date.now() })) + '.firma', expires_in: 3600 } }
      } else if (ep.method === 'GET' && ep.path === '/api/products') {
        result = { status: 200, body: { data: store.products, total: store.products.length } }
      } else if (ep.method === 'GET') {
        const p = store.getProduct(paramId)
        result = p ? { status: 200, body: p } : { status: 404, body: { error: `Producto #${paramId} no encontrado` } }
      } else if (ep.method === 'POST') {
        const p = store.addProduct({ name: body?.name || 'Nuevo', price: body?.price || 0, stock: body?.stock || 0, category: body?.category || 'sin_cat' })
        result = { status: 201, body: { message: 'Producto creado', product: p } }
      } else if (ep.method === 'PUT') {
        const p = store.updateProduct(paramId, body || {})
        result = p ? { status: 200, body: { message: 'Actualizado', product: p } } : { status: 404, body: { error: `#${paramId} no encontrado` } }
      } else {
        const p = store.deleteProduct(paramId)
        result = p ? { status: 200, body: { message: `"${p.name}" eliminado` } } : { status: 404, body: { error: `#${paramId} no encontrado` } }
      }

      setResponse({ ...result, time: Math.round(30 + Math.random() * 80) })
    }

    setRateCount(prev => prev + 1); setLoading(false)
  }

  const copyResponse = () => {
    if (!response) return
    navigator.clipboard.writeText(JSON.stringify(response.body, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('api_page.title')}</h1>
        <p className="text-muted">{t('api_page.subtitle')}</p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-5 p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Shield size={16} /> <span>{t('api_page.role')}:</span>
          {(['viewer', 'editor', 'admin'] as Role[]).map(r => (
            <button key={r} onClick={() => { setRole(r); setRateCount(0) }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${role === r ? 'bg-accent-glow border-accent text-accent' : 'border-border text-muted hover:border-accent hover:text-white'}`}>
              {r === 'admin' ? <Lock size={10} /> : <Unlock size={10} />} {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock size={14} /> {rateCount}/20
          {rateCount >= 20 && <span className="text-red-400 font-semibold">{t('api_page.rate_limit')}</span>}
        </div>
      </div>

      {/* Params */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted uppercase tracking-wide">:id</label>
          <input type="number" value={paramId} onChange={e => setParamId(Number(e.target.value))} min={1}
            className="w-20 px-2 py-1.5 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs text-muted uppercase tracking-wide block mb-1">{t('api_page.body_label')}</label>
          <textarea value={bodyJson} onChange={e => setBodyJson(e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent resize-y" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Endpoints */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">{t('api_page.endpoints')}</h3>
          <div className="space-y-1">
            {ENDPOINTS.map(ep => (
              <button key={`${ep.method} ${ep.path}`} onClick={() => callEndpoint(ep)}
                className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-sm transition-all ${
                  selected?.path === ep.path && selected?.method === ep.method ? 'bg-accent-glow border border-accent' : 'border border-transparent hover:bg-white/[0.03]'
                } ${!canAccess(ep) ? 'opacity-50' : ''}`}>
                <span className="font-bold font-mono min-w-[52px] text-xs" style={{ color: METHOD_COLORS[ep.method] }}>{ep.method}</span>
                <span className="font-mono text-muted text-xs">{ep.path}</span>
                {!canAccess(ep) && <Lock size={10} className="ml-auto text-red-400" />}
              </button>
            ))}
          </div>

          {/* Live store */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">{t('api_page.zustand_store')} ({store.products.length})</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {store.products.map(p => (
                <div key={p.id} className="text-xs text-muted flex justify-between">
                  <span>#{p.id} {p.name}</span><span>{p.price}€</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-border">
            <h3 className="text-sm font-semibold">{t('api_page.response')}</h3>
            {response && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${response.status < 300 ? 'bg-green-500/15 text-green-400' : response.status < 500 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                  {response.status}
                </span>
                <span className="text-xs text-muted font-mono">{response.time}ms</span>
                <button onClick={copyResponse} className="text-muted hover:text-white transition-colors">
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
          <div className="p-4 min-h-[300px]">
            {loading && <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin-slow mx-auto mt-12" />}
            {!loading && !response && <div className="flex flex-col items-center gap-3 text-muted text-sm py-12"><Send size={24} /> {t('api_page.select_endpoint')}</div>}
            {!loading && response && <pre className="text-sm leading-relaxed whitespace-pre-wrap break-all">{JSON.stringify(response.body, null, 2)}</pre>}
          </div>
        </div>
      </div>
    </div>
  )
}
