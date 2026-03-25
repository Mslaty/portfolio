import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, RotateCcw, Server, ArrowRight, ArrowLeft, Bot, User, ChevronDown, ChevronUp, X, Sparkles, Code } from 'lucide-react'

/* ─── Types ─── */
interface McpParam { name: string; type: string; description: string }
interface McpTool {
  name: string
  description: string
  descriptionEn: string
  parameters: McpParam[]
  keywords: string[]
  handler: (params: Record<string, string>) => object
  isCustom?: boolean
  exampleEs?: string
  exampleEn?: string
}

/* ─── Built-in tools (only solid ones) ─── */
const BUILTIN_TOOLS: McpTool[] = [
  {
    name: 'get_weather',
    description: 'Obtiene el clima actual de una ciudad',
    descriptionEn: 'Gets current weather for a city',
    parameters: [{ name: 'city', type: 'string', description: 'City name' }],
    keywords: ['clima', 'weather', 'temperatura', 'tiempo'],
    exampleEs: 'Clima en Barcelona', exampleEn: 'Weather in Barcelona',
    handler: (p) => {
      const data: Record<string, [number, string, number]> = {
        madrid: [28, 'Soleado', 35], barcelona: [24, 'Nublado', 60],
        'las palmas': [22, 'Parcialmente nublado', 55], london: [15, 'Lluvia', 80],
        'new york': [30, 'Despejado', 45], tokyo: [26, 'Humedo', 70],
      }
      const city = (p.city || '').toLowerCase()
      const [temp, cond, hum] = data[city] || [Math.round(15 + Math.random() * 15), 'Variable', Math.round(40 + Math.random() * 40)]
      return { city: p.city, temperature: `${temp}°C`, condition: cond, humidity: `${hum}%` }
    },
  },
  {
    name: 'search_products',
    description: 'Busca productos en el catalogo',
    descriptionEn: 'Searches products in catalog',
    parameters: [{ name: 'query', type: 'string', description: 'Search term' }],
    keywords: ['busca', 'search', 'producto', 'product'],
    exampleEs: 'Busca monitor', exampleEn: 'Search monitor',
    handler: (p) => {
      const catalog = [
        { id: 1, name: 'Monitor 27" 4K', price: 280 }, { id: 2, name: 'Teclado mecanico RGB', price: 80 },
        { id: 3, name: 'Silla ergonomica', price: 350 }, { id: 4, name: 'Auriculares BT Pro', price: 90 },
        { id: 5, name: 'Hub USB-C', price: 60 }, { id: 6, name: 'Webcam 4K', price: 120 },
      ]
      const q = (p.query || '').toLowerCase()
      const results = catalog.filter(pr => pr.name.toLowerCase().includes(q)).slice(0, 3)
      return { query: p.query, results, total: results.length }
    },
  },
  {
    name: 'calculate',
    description: 'Suma, resta, multiplica o divide dos numeros',
    descriptionEn: 'Add, subtract, multiply or divide two numbers',
    parameters: [{ name: 'operation', type: 'string', description: 'add|subtract|multiply|divide' }, { name: 'a', type: 'number', description: 'First' }, { name: 'b', type: 'number', description: 'Second' }],
    keywords: ['calcula', 'calculate', 'suma', 'resta', 'multiplica', 'divide'],
    exampleEs: 'Calcula 250 x 12', exampleEn: 'Calculate 250 x 12',
    handler: (p) => {
      const a = parseFloat(p.a) || 0, b = parseFloat(p.b) || 0
      const ops: Record<string, number> = { add: a + b, subtract: a - b, multiply: a * b, divide: b !== 0 ? a / b : NaN }
      return { operation: p.operation, a, b, result: isNaN(ops[p.operation]) ? 'Error' : Math.round(ops[p.operation] * 100) / 100 }
    },
  },
  {
    name: 'get_datetime',
    description: 'Fecha y hora actual en una zona horaria',
    descriptionEn: 'Current date and time in a timezone',
    parameters: [{ name: 'timezone', type: 'string', description: 'IANA timezone' }],
    keywords: ['hora', 'time', 'fecha', 'date', 'reloj'],
    exampleEs: 'Hora en New York', exampleEn: 'Time in New York',
    handler: (p) => {
      const tz = p.timezone || 'Europe/Madrid'
      try { return { timezone: tz, datetime: new Date().toLocaleString('es-ES', { timeZone: tz, dateStyle: 'full', timeStyle: 'medium' }) } }
      catch { return { error: `Timezone "${tz}" no valida` } }
    },
  },
  {
    name: 'generate_id',
    description: 'Genera un UUID, slug o ID numerico',
    descriptionEn: 'Generates a UUID, slug or numeric ID',
    parameters: [{ name: 'type', type: 'string', description: 'uuid|slug|numeric' }],
    keywords: ['genera', 'generate', 'id', 'uuid', 'slug', 'codigo'],
    exampleEs: 'Genera un UUID', exampleEn: 'Generate a UUID',
    handler: (p) => {
      const type = (p.type || 'uuid').toLowerCase()
      let v = ''
      if (type === 'uuid') v = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })
      else if (type === 'slug') v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      else v = String(Math.floor(100000 + Math.random() * 900000))
      return { type, id: v }
    },
  },
]

/* ─── Routing (simplified, only reliable patterns) ─── */
function routeMessage(msg: string, tools: McpTool[]): { tool: McpTool; params: Record<string, string> } | null {
  const lower = msg.toLowerCase()
  const matched = tools.find(t => t.keywords.some(kw => lower.includes(kw)))
  if (!matched) return null

  const params: Record<string, string> = {}

  if (matched.name === 'get_weather') {
    const cities = ['madrid', 'barcelona', 'las palmas', 'london', 'new york', 'tokyo', 'paris']
    params.city = cities.find(c => lower.includes(c)) || 'Madrid'
  } else if (matched.name === 'search_products') {
    // Take the last meaningful word (after "busca/search" keywords)
    const words = lower.split(/\s+/).filter(w => w.length > 2 && !['busca', 'buscar', 'search', 'productos', 'producto', 'products', 'product'].includes(w))
    params.query = words[words.length - 1] || 'monitor'
  } else if (matched.name === 'calculate') {
    const nums = msg.match(/\d+\.?\d*/g) || ['10', '5']
    let op = 'add'
    if (lower.match(/resta|subtract/) || msg.includes('-')) op = 'subtract'
    if (lower.match(/multiplica|multiply/) || msg.includes('x') || msg.includes('*')) op = 'multiply'
    if (lower.match(/divide/) || msg.includes('/')) op = 'divide'
    params.operation = op; params.a = nums[0] || '10'; params.b = nums[1] || '5'
  } else if (matched.name === 'get_datetime') {
    const tzMap: Record<string, string> = { madrid: 'Europe/Madrid', london: 'Europe/London', 'new york': 'America/New_York', tokyo: 'Asia/Tokyo', paris: 'Europe/Paris' }
    params.timezone = Object.entries(tzMap).find(([k]) => lower.includes(k))?.[1] || 'Europe/Madrid'
  } else if (matched.name === 'generate_id') {
    params.type = lower.includes('slug') ? 'slug' : lower.includes('numer') ? 'numeric' : 'uuid'
  } else {
    // Custom tools: just pass the full user message, tool returns mock response
    params._message = msg
  }

  return { tool: matched, params }
}

/* ─── Message types ─── */
type MsgRole = 'system' | 'user' | 'ai_thinking' | 'tool_call' | 'tool_result' | 'ai_response'
interface FlowMessage { id: number; role: MsgRole; content: string; json?: object; toolName?: string }

let msgId = 0

export default function McpDemo() {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  // Builder
  const [customTools, setCustomTools] = useState<McpTool[]>([])
  const [wizardStep, setWizardStep] = useState(0)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newParams, setNewParams] = useState<McpParam[]>([{ name: '', type: 'string', description: '' }])
  const [newKeywords, setNewKeywords] = useState('')
  const [newInstructions, setNewInstructions] = useState('')
  const [newResponse, setNewResponse] = useState('{\n  "status": "ok",\n  "data": "resultado"\n}')

  // Chat
  const tools = [...BUILTIN_TOOLS, ...customTools]
  const [messages, setMessages] = useState<FlowMessage[]>(() => {
    const list = BUILTIN_TOOLS.map(tl => `  • ${tl.name} — ${tl.description}`).join('\n')
    return [{ id: ++msgId, role: 'system' as MsgRole, content: `MCP Server listo (${BUILTIN_TOOLS.length} tools):\n${list}` }]
  })
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showProtocol, setShowProtocol] = useState(true)
  const [activeTab, setActiveTab] = useState<'simulator' | 'builder'>('builder')
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = useCallback(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight) }, [])
  useEffect(scroll, [messages, scroll])

  const addMsg = useCallback((role: MsgRole, content: string, json?: object, toolName?: string) => {
    setMessages(prev => [...prev, { id: ++msgId, role, content, json, toolName }])
  }, [])

  const handleSend = async () => {
    const text = input.trim(); if (!text || processing) return
    setInput(''); setProcessing(true)
    addMsg('user', text); await new Promise(r => setTimeout(r, 500))

    const route = routeMessage(text, tools)
    if (!route) {
      addMsg('ai_response', isEn ? `No matching tool found. Try: ${tools.map(tl => tl.name).join(', ')}` : `Sin herramienta para eso. Prueba: ${tools.map(tl => tl.name).join(', ')}`)
      setProcessing(false); return
    }

    addMsg('ai_thinking', `→ ${route.tool.name}`)
    await new Promise(r => setTimeout(r, 700))

    const callJson = { jsonrpc: '2.0', method: 'tools/call', params: { name: route.tool.name, arguments: route.params } }
    addMsg('tool_call', `${route.tool.name}(${JSON.stringify(route.params)})`, callJson, route.tool.name)
    await new Promise(r => setTimeout(r, 900))

    const result = route.tool.handler(route.params)
    const resultJson = { jsonrpc: '2.0', result: { content: [{ type: 'text', text: JSON.stringify(result) }] } }
    addMsg('tool_result', JSON.stringify(result), resultJson, route.tool.name)
    await new Promise(r => setTimeout(r, 700))

    // Natural language response
    const rd = result as Record<string, unknown>
    let resp: string
    if (route.tool.name === 'get_weather') resp = `${rd.city}: ${rd.temperature}, ${rd.condition}. ${isEn ? 'Humidity' : 'Humedad'}: ${rd.humidity}`
    else if (route.tool.name === 'search_products') {
      const s = rd as { results: { name: string; price: number }[]; total: number }
      resp = s.total === 0 ? (isEn ? 'No products found.' : 'Sin resultados.') : s.results.map(p => `${p.name} (${p.price}€)`).join(', ')
    }
    else if (route.tool.name === 'calculate') resp = `${rd.a} ${rd.operation} ${rd.b} = ${rd.result}`
    else if (route.tool.name === 'get_datetime') resp = rd.error ? String(rd.error) : String(rd.datetime)
    else if (route.tool.name === 'generate_id') resp = `${rd.type}: ${rd.id}`
    else resp = JSON.stringify(result, null, 2)

    addMsg('ai_response', resp); setProcessing(false)
  }

  const createCustomTool = () => {
    const name = newName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name || tools.some(tl => tl.name === name)) return
    const params = newParams.filter(p => p.name.trim())
    const keywords = newKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    if (!keywords.length) keywords.push(name)
    let mockResponse: object; try { mockResponse = JSON.parse(newResponse) } catch { mockResponse = { result: newResponse } }
    const kws = keywords.join(', ')
    setCustomTools(prev => [...prev, {
      name, description: newDesc || name, descriptionEn: newDesc || name,
      parameters: params, keywords, isCustom: true,
      exampleEs: `${keywords[0]} test`, exampleEn: `${keywords[0]} test`,
      handler: () => mockResponse,
    }])
    addMsg('system', isEn ? `✅ "${name}" deployed! Say something with: ${kws}` : `✅ "${name}" desplegada! Escribe algo con: ${kws}`)
    setWizardStep(0); setNewName(''); setNewDesc(''); setNewInstructions(''); setNewParams([{ name: '', type: 'string', description: '' }]); setNewKeywords(''); setNewResponse('{\n  "status": "ok",\n  "data": "resultado"\n}')
    setActiveTab('simulator')
  }

  const roleStyles: Record<MsgRole, { bg: string; icon: typeof User; label: string }> = {
    system: { bg: 'bg-accent-glow border-accent/30', icon: Server, label: 'Server' },
    user: { bg: 'bg-accent-glow border-accent', icon: User, label: isEn ? 'User' : 'Usuario' },
    ai_thinking: { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Bot, label: 'Routing' },
    tool_call: { bg: 'bg-blue-500/10 border-blue-500/30', icon: ArrowRight, label: 'tool_call' },
    tool_result: { bg: 'bg-green-500/10 border-green-500/30', icon: ArrowLeft, label: 'tool_result' },
    ai_response: { bg: 'bg-card border-border', icon: Bot, label: 'AI' },
  }

  const toolName = newName.trim().toLowerCase().replace(/\s+/g, '_') || 'my_tool'
  const previewSchema = {
    name: toolName,
    description: newDesc || '...',
    ...(newInstructions ? { instructions: newInstructions } : {}),
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(newParams.filter(p => p.name.trim()).map(p => [p.name, { type: p.type }])),
      required: newParams.filter(p => p.name.trim()).map(p => p.name),
    },
  }

  const serverName = `${toolName}_server`
  const connectionUrl = `https://your-server.com/mcp/${serverName}/sse`
  const claudeConfig = {
    mcpServers: {
      [serverName]: {
        command: 'npx',
        args: ['-y', `@your-org/${serverName}`],
      },
    },
  }
  const cursorConfig = {
    name: serverName,
    transport: 'sse',
    url: connectionUrl,
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('mcp_page.title')}</h1>
        <p className="text-muted">{t('mcp_page.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-card border border-border rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'builder' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
          <Sparkles size={16} /> MCP Builder
        </button>
        <button onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'simulator' ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
          <Server size={16} /> {isEn ? 'Simulator' : 'Simulador'} ({tools.length})
        </button>
      </div>

      {/* ═══ BUILDER ═══ */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Sparkles size={20} className="text-accent" />
              {isEn ? 'Build your MCP Tool' : 'Construye tu MCP Tool'}
            </h2>
            <p className="text-xs text-muted mb-4">
              {isEn ? 'Pick a template or start from scratch. Deploy it and test it live.' : 'Elige una plantilla o empieza desde cero. Despliega y pruebala en vivo.'}
            </p>

            {/* Templates */}
            <div className="mb-5">
              <p className="text-[0.65rem] text-muted font-semibold uppercase tracking-wide mb-2">{isEn ? 'Quick start templates' : 'Plantillas rapidas'}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { emoji: '📧', label: isEn ? 'Send email' : 'Enviar email', name: 'send_email', desc: isEn ? 'Sends an email' : 'Envia un email', params: [{ name: 'to', type: 'string', description: '' }, { name: 'subject', type: 'string', description: '' }], kw: 'email, correo, mail', instr: 'Use this tool when the user asks to send an email. The "to" field must be a valid email address. The "subject" should be concise. Returns a message_id on success.', resp: '{\n  "status": "sent",\n  "message_id": "msg_abc123"\n}' },
                  { emoji: '📊', label: isEn ? 'Get KPIs' : 'Obtener KPIs', name: 'get_kpis', desc: isEn ? 'Gets business KPIs' : 'Obtiene KPIs de negocio', params: [{ name: 'period', type: 'string', description: '' }], kw: 'kpi, metricas, metrics, informe', instr: 'Use this tool when the user asks about business metrics, KPIs, revenue, or performance. The "period" should be a date range like "Q1 2024" or "March 2024". Always present the results in a readable format.', resp: '{\n  "revenue": 125000,\n  "orders": 342,\n  "conversion": "3.2%"\n}' },
                  { emoji: '🔍', label: isEn ? 'Search DB' : 'Buscar en BD', name: 'query_database', desc: isEn ? 'Queries a database' : 'Consulta una base de datos', params: [{ name: 'table', type: 'string', description: '' }, { name: 'filter', type: 'string', description: '' }], kw: 'consulta, query, database, registro', instr: 'Use this tool to search records in the database. Available tables: users, orders, products. The "filter" is a free-text search term. Returns matching rows with a total count.', resp: '{\n  "rows": [\n    {"id": 1, "name": "Record A"}\n  ],\n  "total": 1\n}' },
                  { emoji: '🔔', label: isEn ? 'Send notification' : 'Notificacion', name: 'send_notification', desc: isEn ? 'Sends a push notification' : 'Envia una notificacion push', params: [{ name: 'channel', type: 'string', description: '' }, { name: 'message', type: 'string', description: '' }], kw: 'notifica, notify, alerta, alert', instr: 'Use this tool to send notifications to a channel. Available channels: #general, #alerts, #sales. The message should be clear and concise. Returns confirmation with channel and timestamp.', resp: '{\n  "sent": true,\n  "channel": "#general"\n}' },
                ].map(tpl => (
                  <button key={tpl.name}
                    onClick={() => { setNewName(tpl.name); setNewDesc(tpl.desc); setNewParams(tpl.params.map(p => ({ ...p }))); setNewKeywords(tpl.kw); setNewInstructions(tpl.instr); setNewResponse(tpl.resp); setWizardStep(0) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg border border-border text-left hover:border-accent hover:bg-white/[0.02] transition-all">
                    <span className="text-base">{tpl.emoji}</span>
                    <span className="text-xs font-medium">{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="flex gap-2 mb-5">
              {[isEn ? '1. Name' : '1. Nombre', isEn ? '2. Params' : '2. Params', isEn ? '3. Triggers' : '3. Triggers', isEn ? '4. Deploy' : '4. Deploy'].map((label, i) => (
                <button key={i} onClick={() => i <= wizardStep && setWizardStep(i)}
                  className={`flex-1 py-1.5 text-[0.65rem] font-semibold rounded-lg border transition-all text-center ${
                    i === wizardStep ? 'bg-accent text-white border-accent' : i < wizardStep ? 'bg-accent/20 text-accent border-accent/30 cursor-pointer' : 'bg-bg text-muted border-border'}`}>
                  {label}
                </button>
              ))}
            </div>

            {wizardStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'Tool name (snake_case)' : 'Nombre del tool (snake_case)'}</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="get_stock_price"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'What does it do?' : 'Que hace?'}</label>
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder={isEn ? 'Gets stock price for a ticker' : 'Obtiene precio de una accion'}
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    {isEn ? 'Tool Instructions' : 'Instrucciones del tool'}
                    <span className="text-muted font-normal ml-1">({isEn ? 'for the AI' : 'para la IA'})</span>
                  </label>
                  <p className="text-[0.6rem] text-muted mb-1.5">{isEn ? 'Tell the AI when and how to use this tool. This is what makes MCP tools intelligent.' : 'Dile a la IA cuando y como usar este tool. Esto es lo que hace inteligentes a los MCP tools.'}</p>
                  <textarea value={newInstructions} onChange={e => setNewInstructions(e.target.value)} rows={3}
                    placeholder={isEn ? 'Use this tool when the user asks about stock prices. The ticker should be uppercase (e.g. AAPL, TSLA).' : 'Usa este tool cuando el usuario pregunte por precios de acciones. El ticker debe ser en mayusculas (ej. AAPL, TSLA).'}
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-xs focus:outline-none focus:border-accent resize-y" />
                </div>
                <button onClick={() => setWizardStep(1)} disabled={!newName.trim()}
                  className="w-full px-3 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {isEn ? 'Next' : 'Siguiente'} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="space-y-4">
                <label className="text-xs font-semibold block">{isEn ? 'Parameters the AI sends to your tool' : 'Parametros que la IA envia a tu tool'}</label>
                <div className="space-y-2">
                  {newParams.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={p.name} onChange={e => { const np = [...newParams]; np[i] = { ...np[i], name: e.target.value }; setNewParams(np) }}
                        placeholder={i === 0 ? 'ticker' : `param_${i + 1}`}
                        className="flex-1 px-2.5 py-2 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent" />
                      <select value={p.type} onChange={e => { const np = [...newParams]; np[i] = { ...np[i], type: e.target.value }; setNewParams(np) }}
                        className="px-2 py-2 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent">
                        <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option>
                      </select>
                      {newParams.length > 1 && <button onClick={() => setNewParams(prev => prev.filter((_, j) => j !== i))} className="text-muted hover:text-red-400"><X size={16} /></button>}
                    </div>
                  ))}
                  <button onClick={() => setNewParams(prev => [...prev, { name: '', type: 'string', description: '' }])}
                    className="text-xs text-accent hover:text-white transition-colors font-medium">+ {isEn ? 'Add' : 'Anadir'}</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(0)} className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-white">{isEn ? 'Back' : 'Atras'}</button>
                  <button onClick={() => setWizardStep(2)} className="flex-1 px-3 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover flex items-center justify-center gap-2">
                    {isEn ? 'Next' : 'Siguiente'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'Trigger keywords (comma separated)' : 'Keywords de activacion (separadas por coma)'}</label>
                  <p className="text-[0.6rem] text-muted mb-1.5">{isEn ? 'When the user says any of these words, your tool runs.' : 'Cuando el usuario diga alguna de estas palabras, tu tool se ejecuta.'}</p>
                  <input value={newKeywords} onChange={e => setNewKeywords(e.target.value)} placeholder="stock, price, accion, precio"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'Mock response (JSON)' : 'Respuesta mock (JSON)'}</label>
                  <p className="text-[0.6rem] text-muted mb-1.5">{isEn ? 'Your tool always returns this. In production it would call a real API.' : 'Tu tool siempre devuelve esto. En produccion llamaria a una API real.'}</p>
                  <textarea value={newResponse} onChange={e => setNewResponse(e.target.value)} rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent resize-y" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(1)} className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-white">{isEn ? 'Back' : 'Atras'}</button>
                  <button onClick={() => setWizardStep(3)} className="flex-1 px-3 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover flex items-center justify-center gap-2">
                    {isEn ? 'Next' : 'Siguiente'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-3">
                {/* Schema */}
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'MCP Tool Schema' : 'Schema del Tool MCP'}</label>
                  <pre className="bg-bg border border-border rounded-lg p-2.5 text-[0.65rem] leading-relaxed overflow-x-auto text-accent max-h-32 overflow-y-auto">
                    {JSON.stringify(previewSchema, null, 2)}
                  </pre>
                </div>
                {/* Connection URL */}
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'Connection URL (SSE)' : 'URL de conexion (SSE)'}</label>
                  <p className="text-[0.55rem] text-muted mb-1">{isEn ? 'Clients connect to your MCP server via this URL.' : 'Los clientes se conectan a tu servidor MCP via esta URL.'}</p>
                  <code className="block bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[0.65rem] text-green-400 overflow-x-auto">{connectionUrl}</code>
                </div>
                {/* Client configs */}
                <div>
                  <label className="text-xs font-semibold block mb-1">{isEn ? 'Client configuration' : 'Configuracion del cliente'}</label>
                  <p className="text-[0.55rem] text-muted mb-1.5">{isEn ? 'Add this to your client config to connect:' : 'Anade esto a la config de tu cliente para conectar:'}</p>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[0.6rem] text-muted font-semibold">Claude Desktop</span>
                      <pre className="bg-bg border border-border rounded-lg p-2 text-[0.6rem] leading-relaxed overflow-x-auto text-muted max-h-20 overflow-y-auto">{JSON.stringify(claudeConfig, null, 2)}</pre>
                    </div>
                    <div>
                      <span className="text-[0.6rem] text-muted font-semibold">Cursor</span>
                      <pre className="bg-bg border border-border rounded-lg p-2 text-[0.6rem] leading-relaxed overflow-x-auto text-muted max-h-20 overflow-y-auto">{JSON.stringify(cursorConfig, null, 2)}</pre>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(2)} className="flex-1 px-3 py-2.5 rounded-lg border border-border text-sm text-muted hover:text-white">{isEn ? 'Back' : 'Atras'}</button>
                  <button onClick={createCustomTool} disabled={!newName.trim()}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-500 disabled:opacity-40 flex items-center justify-center gap-2">
                    <Sparkles size={16} /> {isEn ? 'Deploy!' : 'Desplegar!'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: live code */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Code size={16} className="text-accent" />
              {isEn ? 'Generated TypeScript' : 'TypeScript generado'}
            </h3>
            <pre className="bg-bg border border-border rounded-lg p-4 text-[0.65rem] leading-relaxed overflow-auto max-h-[55vh] text-muted">
              <span className="text-blue-400">import</span> {'{ McpServer }'} <span className="text-blue-400">from</span> <span className="text-green-400">"@modelcontextprotocol/sdk/server"</span>{'\n'}
              <span className="text-blue-400">import</span> {'{ StdioServerTransport }'} <span className="text-blue-400">from</span> <span className="text-green-400">"@modelcontextprotocol/sdk/server/stdio"</span>{'\n\n'}
              <span className="text-blue-400">const</span> server = <span className="text-blue-400">new</span> <span className="text-yellow-400">McpServer</span>({'{\n'}
              {'  name: '}<span className="text-green-400">"{serverName}"</span>{',\n'}
              {'  version: '}<span className="text-green-400">"1.0.0"</span>{',\n'}
              {newInstructions && <>{'  instructions: '}<span className="text-green-400">"{newInstructions.slice(0, 60)}{newInstructions.length > 60 ? '...' : ''}"</span>{',\n'}</>}
              {'})\n\n'}
              <span className="text-muted">{'// Register tool\n'}</span>
              {'server.'}<span className="text-yellow-400">tool</span>{'(\n'}
              {'  '}<span className="text-green-400">"{previewSchema.name}"</span>{',\n'}
              {'  '}<span className="text-green-400">"{newDesc || '...'}"</span>{',\n'}
              {'  {\n'}
              {newParams.filter(p => p.name.trim()).map(p => `    ${p.name}: { type: "${p.type}" },\n`).join('')}
              {'  },\n'}
              {'  '}<span className="text-blue-400">async</span> {'('}<span className="text-yellow-400">{'{ '}{newParams.filter(p => p.name.trim()).map(p => p.name).join(', ')}{' }'}</span>{') => {\n'}
              {'    '}<span className="text-muted">{'// Your logic: API call, DB query, etc.\n'}</span>
              {'    '}<span className="text-blue-400">const</span>{' result = '}<span className="text-muted">{'/* ... */\n'}</span>
              {'    '}<span className="text-blue-400">return</span>{' {\n'}
              {'      content: [{ type: '}<span className="text-green-400">"text"</span>{', text: JSON.stringify(result) }]\n'}
              {'    }\n  }\n)\n\n'}
              <span className="text-muted">{'// Start server\n'}</span>
              {'server.'}<span className="text-yellow-400">connect</span>{'('}<span className="text-blue-400">new</span>{' StdioServerTransport())\n'}
            </pre>

            {customTools.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold mb-2">{isEn ? 'Deployed tools' : 'Tools desplegadas'}</p>
                {customTools.map(tl => (
                  <div key={tl.name} className="flex items-center justify-between text-xs text-muted py-1">
                    <span><code className="text-accent">{tl.name}</code></span>
                    <button onClick={() => setCustomTools(prev => prev.filter(tt => tt.name !== tl.name))} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SIMULATOR ═══ */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
              <Server size={14} className="text-accent" />
              <h3 className="text-xs font-semibold">{t('mcp_page.server_tools')} ({tools.length})</h3>
            </div>
            <div className="p-2 space-y-1 max-h-[35vh] overflow-y-auto">
              {tools.map(tool => (
                <div key={tool.name} className={`bg-bg border rounded-lg p-2 ${tool.isCustom ? 'border-accent/40' : 'border-border'}`}>
                  <code className="text-[0.65rem] font-bold text-accent">{tool.name}</code>
                  {tool.isCustom && <span className="text-[0.5rem] bg-accent/20 text-accent px-1 rounded ml-1">custom</span>}
                  <p className="text-[0.55rem] text-muted">{isEn ? tool.descriptionEn : tool.description}</p>
                </div>
              ))}
            </div>
            <div className="px-2 py-2 border-t border-border">
              <p className="text-[0.55rem] text-muted font-semibold uppercase tracking-wide mb-1">{t('mcp_page.try_asking')}</p>
              {tools.map(tl => (
                <button key={tl.name} onClick={() => setInput((isEn ? tl.exampleEn : tl.exampleEs) || tl.name)}
                  className="block w-full text-left text-[0.6rem] text-muted hover:text-accent px-1.5 py-0.5 rounded hover:bg-white/[0.03] transition-colors truncate">
                  → {(isEn ? tl.exampleEn : tl.exampleEs) || tl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden min-h-[500px]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <Bot size={16} className="text-accent" />
                <strong>{t('mcp_page.interaction')}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowProtocol(!showProtocol)} className="flex items-center gap-1 text-[0.7rem] text-muted hover:text-white">
                  {showProtocol ? <ChevronUp size={12} /> : <ChevronDown size={12} />} JSON-RPC
                </button>
                <button onClick={() => setMessages([])} className="flex items-center gap-1 text-[0.7rem] text-muted hover:text-white">
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => {
                const style = roleStyles[m.role]
                return (
                  <div key={m.id} className={`border rounded-lg p-3 ${style.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <style.icon size={14} className={m.role === 'tool_call' ? 'text-blue-400' : m.role === 'tool_result' ? 'text-green-400' : m.role === 'ai_thinking' ? 'text-yellow-400' : m.role === 'system' ? 'text-accent' : ''} />
                      <span className="text-[0.6rem] font-semibold text-muted uppercase tracking-wide">{style.label}</span>
                      {m.toolName && <code className="text-[0.6rem] text-accent">{m.toolName}</code>}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    {showProtocol && m.json && (
                      <pre className="mt-2 p-2 bg-bg rounded text-[0.55rem] text-muted overflow-x-auto leading-relaxed">{JSON.stringify(m.json, null, 2)}</pre>
                    )}
                  </div>
                )
              })}
              {processing && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin-slow" />
                </div>
              )}
            </div>

            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t('mcp_page.input_placeholder')} disabled={processing}
                className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent disabled:opacity-50" />
              <button onClick={handleSend} disabled={processing || !input.trim()}
                className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40">
                <Play size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
