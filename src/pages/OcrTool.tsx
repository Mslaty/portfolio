import { useState, useRef, useMemo, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Download, RotateCcw, X, Key, Eye, EyeOff, ExternalLink, ShieldCheck, Trash2, ChevronDown, ChevronUp, FileText, Plus, Zap } from 'lucide-react'

const STORAGE_KEY = 'portfolio_gemini_key'

const AVAILABLE_COLUMNS = [
  { id: 'fecha', label: 'Fecha', hint: 'de la factura, formato DD/MM/YYYY' },
  { id: 'n_factura', label: 'N Factura', hint: 'numero de factura o albaran' },
  { id: 'descripcion', label: 'Descripcion', hint: 'nombre del producto o servicio' },
  { id: 'cantidad', label: 'Cantidad', hint: 'unidades' },
  { id: 'precio_unitario', label: 'Precio Unitario', hint: 'precio por unidad sin IVA' },
  { id: 'descuento', label: 'Descuento %', hint: 'porcentaje de descuento, 0 si no hay' },
  { id: 'iva', label: 'IVA %', hint: 'porcentaje de IVA aplicado' },
  { id: 'importe', label: 'Importe', hint: 'importe total de la linea' },
  { id: 'ean', label: 'Codigo EAN', hint: 'codigo de barras EAN del producto' },
  { id: 'referencia', label: 'Referencia', hint: 'codigo de referencia del proveedor' },
  { id: 'lote', label: 'Lote', hint: 'numero de lote del producto' },
  { id: 'caducidad', label: 'Caducidad', hint: 'fecha de caducidad del producto' },
  { id: 'fabricante', label: 'Fabricante', hint: 'nombre del fabricante o marca' },
  { id: 'unidad_medida', label: 'Unidad de Medida', hint: 'kg, litros, unidades, etc.' },
]

const DEFAULT_SELECTED = ['fecha', 'n_factura', 'descripcion', 'cantidad', 'precio_unitario', 'descuento', 'iva', 'importe']

const PROGRESS_MSGS = ['Enviando PDF a Gemini...', 'Analizando documento...', 'Extrayendo columnas...', 'Generando resultados...']

function buildPrompt(columns: typeof AVAILABLE_COLUMNS): string {
  const colList = columns.map((c, i) => `${i + 1}. ${c.label} (${c.hint})`).join('\n')
  return `Eres un experto extractor de datos de facturas. Analiza este PDF y extrae TODAS las lineas de productos/servicios.

Para cada linea extrae estas columnas exactas en este orden:
${colList}

REGLAS:
- Devuelve SOLO un JSON valido, sin markdown ni explicaciones.
- El JSON debe ser un array de arrays de strings: [["valor1","valor2",...], ...]
- Cada sub-array debe tener exactamente ${columns.length} elementos.
- Si un campo no existe pon cadena vacia "".
- Los numeros deben ser strings (ej: "10.50", "21", "3").
- Extrae TODAS las lineas, de todas las paginas.`
}

async function callGeminiOCR(apiKey: string, pdfBase64: string, prompt: string): Promise<string[][]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  })
  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit. Espera un momento.')
    if (res.status === 403) throw new Error('API key invalida.')
    const err = await res.json().catch(() => ({}))
    throw new Error((err as Record<string, Record<string, string>>)?.error?.message || `Error ${res.status}`)
  }
  const data = await res.json()
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No se pudo extraer datos. Verifica que sea una factura legible.')
  const parsed: string[][] = JSON.parse(match[0])
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('Sin lineas detectables.')
  return parsed
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve((r.result as string).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function OcrTool() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [showKey, setShowKey] = useState(false)
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem(STORAGE_KEY))
  const [selectedCols, setSelectedCols] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED))
  const [customCol, setCustomCol] = useState('')
  const [customCols, setCustomCols] = useState<{ id: string; label: string; hint: string }[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [rows, setRows] = useState<string[][] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const allColumns = useMemo(() => [...AVAILABLE_COLUMNS, ...customCols], [customCols])
  const activeColumns = useMemo(() => allColumns.filter(c => selectedCols.has(c.id)), [allColumns, selectedCols])
  const { t } = useTranslation()
  const hasKey = apiKey.trim().length > 0

  const saveKey = () => { const k = apiKey.trim(); if (k) localStorage.setItem(STORAGE_KEY, k); else localStorage.removeItem(STORAGE_KEY) }
  const deleteKey = () => { localStorage.removeItem(STORAGE_KEY); setApiKey(''); setShowKey(false) }
  const toggleCol = (id: string) => setSelectedCols(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const addCustomCol = () => {
    const label = customCol.trim(); if (!label) return
    const id = 'custom_' + label.toLowerCase().replace(/\s+/g, '_')
    if (allColumns.some(c => c.id === id)) return
    setCustomCols(prev => [...prev, { id, label, hint: label.toLowerCase() }])
    setSelectedCols(prev => new Set(prev).add(id)); setCustomCol('')
  }

  const removeCustomCol = (id: string) => {
    setCustomCols(prev => prev.filter(c => c.id !== id))
    setSelectedCols(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const loadPdf = async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Solo PDF.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Max 10 MB.'); return }
    // Validate PDF magic bytes (%PDF-)
    const header = await file.slice(0, 5).text()
    if (!header.startsWith('%PDF-')) { setError('Archivo no es un PDF valido.'); return }
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfFile(file); setPdfUrl(URL.createObjectURL(file)); setRows(null); setError(null); setEditedCells(new Set())
  }

  const clearPdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfFile(null); setPdfUrl(null); setRows(null); setError(null); setEditedCells(new Set())
  }

  const handleDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadPdf(f) }

  const processOcr = async () => {
    if (!pdfFile) return
    const key = apiKey.trim() || localStorage.getItem(STORAGE_KEY) || ''
    if (!key) { setError('Introduce tu API key.'); setShowGuide(true); return }
    if (!activeColumns.length) { setError('Selecciona al menos una columna.'); return }
    setProcessing(true); setRows(null); setError(null); setEditedCells(new Set())
    let msgIdx = 0; setProgressMsg(PROGRESS_MSGS[0])
    const interval = setInterval(() => { msgIdx = (msgIdx + 1) % PROGRESS_MSGS.length; setProgressMsg(PROGRESS_MSGS[msgIdx]) }, 2500)
    try {
      const base64 = await fileToBase64(pdfFile)
      setRows(await callGeminiOCR(key, base64, buildPrompt(activeColumns)))
    } catch (e) { setError(e instanceof Error ? e.message : 'Error desconocido.') }
    finally { clearInterval(interval); setProcessing(false); setProgressMsg('') }
  }

  const sanitizeCsvCell = (v: string) => {
    const s = String(v).replace(/"/g, '""')
    return /^[=+\-@\t\r]/.test(s) ? `"'${s}"` : `"${s}"`
  }

  const handleCsvExport = () => {
    if (!rows) return
    const h = activeColumns.map(c => sanitizeCsvCell(c.label)).join(',')
    const b = rows.map(r => r.map(c => sanitizeCsvCell(c)).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + h + '\n' + b], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'factura_ocr.csv'; a.click()
  }

  const handleCellEdit = (ri: number, ci: number, v: string) => {
    if (!rows) return
    setRows(rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? v : c) : r))
    setEditedCells(prev => new Set(prev).add(`${ri}-${ci}`)); setEditingCell(null)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">{t('ocr_page.title')}</h1>
      <p className="text-muted mb-6">{t('ocr_page.subtitle')}</p>

      {/* Security */}
      <div className="flex gap-3 items-start p-4 bg-green-500/[0.06] border border-green-500/20 rounded-xl mb-4 text-sm text-muted">
        <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
        <div><strong className="text-green-500">{t('ocr_page.security')}</strong> {t('ocr_page.security_desc')}</div>
      </div>

      {/* Guide toggle */}
      <button onClick={() => setShowGuide(!showGuide)} className="flex items-center gap-1 text-sm font-medium text-accent mb-3 hover:opacity-80 transition-opacity">
        {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {hasKey ? t('ocr_page.guide_toggle_has_key') : t('ocr_page.guide_toggle_no_key')}
      </button>

      {showGuide && (
        <div className="bg-card border border-border rounded-xl p-5 mb-5">
          <h3 className="font-semibold mb-3">{t('ocr_page.guide_title')}</h3>
          <ol className="space-y-2.5 mb-4">
            {[
              <>{t('ocr_page.guide_step1')} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a></>,
              <>{t('ocr_page.guide_step2')}</>,
              <>{t('ocr_page.guide_step3')}</>,
              <>{t('ocr_page.guide_step4')}</>,
            ].map((content, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-muted items-start">
                <span className="flex items-center justify-center w-5 h-5 min-w-[20px] rounded-full bg-accent-glow text-accent text-xs font-bold">{i + 1}</span>
                <div>{content}</div>
              </li>
            ))}
          </ol>
          <div className="border-t border-border pt-3">
            <h4 className="text-sm text-yellow-500 font-semibold mb-2">{t('ocr_page.guide_cleanup_title')}</h4>
            <p className="text-xs text-muted mb-2">{t('ocr_page.guide_cleanup_desc')}</p>
            <p className="text-xs text-muted/70 italic">{t('ocr_page.guide_free_note')}</p>
          </div>
        </div>
      )}

      {/* API Key */}
      <div className="flex gap-2 items-center mb-5 p-3 bg-card border border-border rounded-xl">
        <Key size={18} className="text-muted shrink-0" />
        <input type={showKey ? 'text' : 'password'} placeholder={t('ocr_page.key_placeholder')} value={apiKey}
          onChange={e => setApiKey(e.target.value)} onBlur={saveKey} onKeyDown={e => e.key === 'Enter' && saveKey()}
          className="flex-1 px-3 py-1.5 rounded-lg bg-bg border border-border text-white text-sm font-mono focus:outline-none focus:border-accent" />
        <button onClick={() => setShowKey(!showKey)} className="px-1.5 text-muted hover:text-white transition-colors">{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        {hasKey && <button onClick={deleteKey} className="px-1.5 text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>}
        <span className={`text-xs font-medium whitespace-nowrap ${hasKey ? 'text-green-500' : 'text-yellow-500'}`}>{hasKey ? t('ocr_page.key_saved') : t('ocr_page.key_required')}</span>
      </div>

      {/* Drop zone */}
      {!pdfFile && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-5 ${dragging ? 'border-accent bg-accent-glow' : 'border-border hover:border-accent hover:bg-accent-glow'}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); e.target.value = '' }} />
          <Upload size={36} className="text-muted mx-auto mb-2" />
          <p className="text-muted">{t('ocr_page.drop_text')}</p>
          <span className="text-xs text-muted/60">{t('ocr_page.drop_hint')}</span>
        </div>
      )}

      {/* Workspace */}
      {pdfFile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PDF preview */}
          <div className="bg-card border border-border rounded-xl overflow-hidden lg:sticky lg:top-20">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm min-w-0"><FileText size={16} /><span className="truncate">{pdfFile.name}</span><span className="text-muted text-xs shrink-0">({(pdfFile.size / 1024).toFixed(0)} KB)</span></div>
              <button onClick={clearPdf} className="text-muted hover:text-white transition-colors"><X size={14} /></button>
            </div>
            <div className="h-[50vh] lg:h-[70vh] min-h-[300px]">
              {pdfUrl && <object data={pdfUrl} type="application/pdf" className="w-full h-full"><p className="p-4 text-sm text-muted">{t('ocr_page.no_preview')} <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-accent">{t('ocr_page.open_pdf')}</a></p></object>}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Column selector */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-1">{t('ocr_page.columns_title')}</h3>
              <p className="text-xs text-muted mb-3">{t('ocr_page.columns_hint')}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {AVAILABLE_COLUMNS.map(col => (
                  <button key={col.id} onClick={() => toggleCol(col.id)} title={col.hint}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedCols.has(col.id) ? 'bg-accent-glow border-accent text-accent font-medium' : 'border-border text-muted hover:border-accent hover:text-white'}`}>
                    {col.label}
                  </button>
                ))}
                {customCols.map(col => (
                  <button key={col.id} onClick={() => toggleCol(col.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border border-dashed transition-all inline-flex items-center gap-1 ${selectedCols.has(col.id) ? 'bg-accent-glow border-accent text-accent font-medium' : 'border-border text-muted'}`}>
                    {col.label}
                    <span onClick={e => { e.stopPropagation(); removeCustomCol(col.id) }} className="opacity-60 hover:opacity-100 hover:text-red-400"><X size={10} /></span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder={t('ocr_page.custom_placeholder')} value={customCol}
                  onChange={e => setCustomCol(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomCol()}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-bg border border-border text-white text-sm focus:outline-none focus:border-accent" />
                <button onClick={addCustomCol} disabled={!customCol.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border text-white hover:bg-white/5 transition-colors disabled:opacity-40">
                  <Plus size={14} /> {t('ocr_page.add')}
                </button>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted">{activeColumns.length} {t('ocr_page.columns')}</span>
                <button onClick={processOcr} disabled={processing || !activeColumns.length}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
                  {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />{progressMsg}</> : <><Zap size={16} /> {t('ocr_page.extract')}</>}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-card border border-red-500 rounded-xl p-4">
                <div className="flex justify-between items-start"><strong className="text-red-400">{t('ocr_page.error')}</strong><button onClick={() => setError(null)} className="text-muted hover:text-white"><X size={14} /></button></div>
                <p className="text-sm text-muted mt-1">{error}</p>
                {pdfFile && !processing && <button onClick={processOcr} className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg text-xs border border-border text-white hover:bg-white/5 transition-colors"><RotateCcw size={12} /> {t('ocr_page.retry')}</button>}
              </div>
            )}

            {/* Results */}
            {rows && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 mr-2">{t('ocr_page.extracted')}</span>{rows.length} {t('ocr_page.lines')} &middot; {activeColumns.length} {t('ocr_page.columns')}</h3>
                    {editedCells.size > 0 && <span className="text-xs text-muted">{editedCells.size} {t('ocr_page.cells_edited')}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCsvExport} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors"><Download size={14} /> CSV</button>
                    <button onClick={processOcr} disabled={processing} className="px-2 py-1 rounded-lg text-xs border border-border text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"><RotateCcw size={14} /></button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr>{activeColumns.map(c => <th key={c.id} className="bg-white/[0.03] px-3 py-2 text-left text-xs uppercase tracking-wide text-muted border-b border-border whitespace-nowrap font-semibold">{c.label}</th>)}</tr></thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          {activeColumns.map((_, j) => {
                            const ck = `${i}-${j}`, ed = editingCell === ck, was = editedCells.has(ck), v = row[j] ?? ''
                            return (
                              <td key={j} onClick={() => setEditingCell(ck)} className={`px-3 py-1.5 border-b border-white/[0.03] whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis cursor-text ${was ? 'bg-accent/10' : ''}`}>
                                {ed ? <input autoFocus defaultValue={v} onBlur={e => handleCellEdit(i, j, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingCell(null) }}
                                  className="w-full px-1 py-0.5 rounded bg-bg border border-accent text-white text-sm focus:outline-none" /> : v}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
