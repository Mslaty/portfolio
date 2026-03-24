import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Bot, User, Wifi, WifiOff, Trash2, Key, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { callGeminiChat } from '../services/gemini'
import { useApiKey } from '../hooks/useApiKey'

interface Message {
  id: number
  agent: string
  role: 'user' | 'agent'
  text: string
  time: string
}

const AGENTS = [
  { id: 'asistente', nameKey: 'chat_page.agent_assistant', color: '#22c55e', descKey: 'chat_page.agent_assistant_desc',
    system: 'Eres un asistente general amable y conciso. Respondes en espanol. Maximo 2-3 frases.' },
  { id: 'ventas', nameKey: 'chat_page.agent_sales', color: '#6c63ff', descKey: 'chat_page.agent_sales_desc',
    system: 'Eres un analista comercial experto. Respondes con datos inventados pero realistas sobre ventas, KPIs y CRM. Conciso, espanol, max 3 frases. Usa numeros.' },
  { id: 'soporte', nameKey: 'chat_page.agent_support', color: '#f59e0b', descKey: 'chat_page.agent_support_desc',
    system: 'Eres un ingeniero de soporte DevOps. Respondes sobre servidores, Docker, bases de datos y logs. Tecnico y conciso, espanol, max 3 frases.' },
]

function now() { return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

export default function ChatDemo() {
  const { t } = useTranslation()
  const { apiKey, setApiKey, showKey, setShowKey, hasKey, save, remove } = useApiKey()
  const [activeAgent, setActiveAgent] = useState('asistente')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(true)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  const scrollToBottom = useCallback(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [])
  useEffect(scrollToBottom, [messages, typing, scrollToBottom])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !connected || typing || !hasKey) return

    const userMsg: Message = { id: ++idRef.current, agent: activeAgent, role: 'user', text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setTyping(true)

    const agent = AGENTS.find(a => a.id === activeAgent)!
    const history = messages.filter(m => m.agent === activeAgent).map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model', text: m.text,
    }))

    try {
      const response = await callGeminiChat(apiKey.trim(), agent.system, history, text)
      setMessages(prev => [...prev, { id: ++idRef.current, agent: activeAgent, role: 'agent', text: response, time: now() }])
    } catch (e) {
      setMessages(prev => [...prev, { id: ++idRef.current, agent: activeAgent, role: 'agent', text: `Error: ${e instanceof Error ? e.message : 'Fallo'}`, time: now() }])
    } finally { setTyping(false) }
  }

  const agent = AGENTS.find(a => a.id === activeAgent)!
  const agentMessages = messages.filter(m => m.agent === activeAgent)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('chat_page.title')}</h1>
        <p className="text-muted">{t('chat_page.subtitle')}</p>
      </div>

      {/* API Key */}
      {!hasKey && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted mb-3">
            <Key size={16} /> {t('chat_page.need_key')}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent inline-flex items-center gap-1">{t('chat_page.get_free')} <ExternalLink size={12} /></a>
          </div>
          <div className="flex gap-2">
            <input type={showKey ? 'text' : 'password'} placeholder="AIza..." value={apiKey}
              onChange={e => setApiKey(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && save()}
              className="flex-1 px-3 py-2 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent" />
            <button onClick={() => setShowKey(!showKey)} className="px-2 text-muted hover:text-white transition-colors">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {hasKey && (
        <div className="flex items-center gap-2 mb-4 text-xs text-muted">
          <span className="text-green-500 font-medium">{t('chat_page.key_saved')}</span>
          <button onClick={remove} className="text-red-400 hover:text-red-300 transition-colors underline">{t('chat_page.delete_key')}</button>
        </div>
      )}

      {/* Chat layout */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] border border-border rounded-xl overflow-hidden md:h-[70vh] md:min-h-[450px]">
        {/* Sidebar */}
        <div className="bg-card md:border-r border-b md:border-b-0 border-border flex md:flex-col flex-row flex-wrap p-3 gap-2">
          <div className="flex justify-between items-center mb-1 w-full">
            <h3 className="text-sm font-semibold">{t('chat_page.agents')}</h3>
            <button onClick={() => setConnected(!connected)}
              className={`flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full ${connected ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />} {connected ? t('chat_page.online') : t('chat_page.offline')}
            </button>
          </div>
          {AGENTS.map(a => (
            <button key={a.id} onClick={() => setActiveAgent(a.id)}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all ${activeAgent === a.id ? 'bg-accent-glow border border-accent' : 'border border-transparent hover:bg-white/[0.03]'}`}>
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
              <div><strong className="text-sm block">{t(a.nameKey)}</strong><span className="text-[0.7rem] text-muted">{t(a.descKey)}</span></div>
            </button>
          ))}
          <button onClick={() => setMessages([])} className="md:mt-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:text-white hover:border-muted transition-colors">
            <Trash2 size={12} /> {t('chat_page.clean')}
          </button>
        </div>

        {/* Main */}
        <div className="flex flex-col bg-bg">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
            <strong>{t(agent.nameKey)}</strong>
            <span className="ml-auto text-xs text-muted">{connected ? t('chat_page.connected') : t('chat_page.disconnected')}</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px] md:min-h-0">
            {agentMessages.length === 0 && !typing && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted text-sm">
                <Bot size={32} /><p>{t('chat_page.start_chat')} {t(agent.nameKey)}</p>
              </div>
            )}
            {agentMessages.map(m => (
              <div key={m.id} className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center border ${m.role === 'user' ? 'bg-accent border-accent text-white' : 'bg-card border-border text-muted'}`}>
                  {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                </div>
                <div className={`rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-accent-glow border border-accent' : 'bg-card border border-border'}`}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <span className="text-[0.65rem] text-muted block mt-1">{m.time}</span>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 min-w-[28px] rounded-full flex items-center justify-center bg-card border border-border text-muted"><Bot size={13} /></div>
                <div className="bg-card border border-border rounded-xl px-3 py-2 flex gap-1 items-center">
                  {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted" style={{ animation: `typing 1.2s ease-in-out infinite ${i * 0.2}s` }} />)}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-4 py-3 border-t border-border">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={!hasKey ? t('chat_page.enter_key_first') : connected ? t('chat_page.write_message') : t('chat_page.disconnected')}
              disabled={!connected || !hasKey}
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-white text-sm focus:outline-none focus:border-accent disabled:opacity-50" />
            <button onClick={sendMessage} disabled={!connected || !input.trim() || !hasKey || typing}
              className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
