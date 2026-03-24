import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, RotateCcw, CheckCircle, Clock, ArrowRight, Download } from 'lucide-react'
import {
  parseCSV, validateRows, transformRows, generateReport, exportCSV,
  type RawRow, type ValidatedRow, type TransformedRow, type PipelineReport,
} from '../services/pipeline'

const RAW_CSV = `fecha;producto;codigo;cantidad;precio;descuento;region;vendedor
15/01/2024;Monitor 27" 4K;MON-001;3;279.99;5;Canarias;Ana Lopez
15/01/2024;Teclado Mecanico RGB;TEC-042;;79.90;0;Peninsula;Carlos Ruiz
16/01/2024;Auriculares BT Pro;AUR-015;2;89.50;10;Baleares;Ana Lopez
16/01/2024;Hub USB-C 7p;HUB-008;5;59.99;0;Canarias;Maria Diaz
17/01/2024;Webcam HD 1080p;WEB-003;1;-45.00;0;Peninsula;Carlos Ruiz
17/01/2024;Monitor 27" 4K;MON-001;2;279.99;15;Canarias;Ana Lopez
18/01/2024;Teclado Mecanico RGB;TEC-042;4;79.90;0;Baleares;
19/01/2024;SSD 1TB NVMe;SSD-100;3;109.95;5;Peninsula;Maria Diaz
19/01/2024;Auriculares BT Pro;AUR-015;1;89.50;0;Canarias;Carlos Ruiz
20/01/2024;Monitor 27" 4K;MON-001;abc;279.99;0;Peninsula;Ana Lopez`

type StepId = 'raw' | 'validate' | 'transform' | 'load' | 'report'
type StepStatus = 'idle' | 'running' | 'done'

interface LogEntry { time: string; step: string; msg: string; type: 'info' | 'success' | 'error' | 'warn' }
function ts() { return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

const STEP_IDS: { id: StepId; labelKey: string }[] = [
  { id: 'raw', labelKey: 'pipeline_page.step_load' },
  { id: 'validate', labelKey: 'pipeline_page.step_validate' },
  { id: 'transform', labelKey: 'pipeline_page.step_transform' },
  { id: 'load', labelKey: 'pipeline_page.step_crm' },
  { id: 'report', labelKey: 'pipeline_page.step_report' },
]

export default function PipelineDemo() {
  const { t } = useTranslation()
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({})
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeStep, setActiveStep] = useState<StepId | null>(null)
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [transformedRows, setTransformedRows] = useState<TransformedRow[]>([])
  const [report, setReport] = useState<PipelineReport | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const scrollLog = useCallback(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [])
  useEffect(scrollLog, [logs, scrollLog])

  const addLog = useCallback((step: string, msg: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { time: ts(), step, msg, type }])
  }, [])

  const run = useCallback(async () => {
    setRunning(true); setLogs([]); setStatuses({}); setActiveStep(null)
    setRawRows([]); setValidatedRows([]); setTransformedRows([]); setReport(null)
    addLog('pipeline', 'Iniciando pipeline ETL...', 'info')

    // 1. Parse
    setStatuses(s => ({ ...s, raw: 'running' })); setActiveStep('raw')
    addLog('Cargar', `Parseando CSV: ${RAW_CSV.split('\n').length - 1} filas`, 'info')
    await new Promise(r => setTimeout(r, 800))
    const raw = parseCSV(RAW_CSV)
    setRawRows(raw); setStatuses(s => ({ ...s, raw: 'done' }))
    addLog('Cargar', `${raw.length} registros cargados`, 'success')

    // 2. Validate
    setStatuses(s => ({ ...s, validate: 'running' })); setActiveStep('validate')
    addLog('Validar', 'Validando campos obligatorios, tipos y rangos...', 'info')
    await new Promise(r => setTimeout(r, 1200))
    const validated = validateRows(raw)
    setValidatedRows(validated)
    const valid = validated.filter(r => r._valid === 'si').length
    const invalid = validated.length - valid
    setStatuses(s => ({ ...s, validate: 'done' }))
    addLog('Validar', `${valid} validos, ${invalid} descartados`, invalid > 0 ? 'warn' : 'success')
    validated.filter(r => r._valid === 'no').forEach(r => addLog('Validar', `Descartado: ${r.producto} → ${r._errors}`, 'error'))

    // 3. Transform
    setStatuses(s => ({ ...s, transform: 'running' })); setActiveStep('transform')
    addLog('Transformar', 'Normalizando fechas, calculando importes y margenes...', 'info')
    await new Promise(r => setTimeout(r, 1800))
    const transformed = transformRows(validated)
    setTransformedRows(transformed); setStatuses(s => ({ ...s, transform: 'done' }))
    addLog('Transformar', `${transformed.length} filas transformadas`, 'success')

    // 4. Load
    setStatuses(s => ({ ...s, load: 'running' })); setActiveStep('load')
    addLog('Cargar CRM', `INSERT INTO crm.ventas ... ${transformed.length} filas`, 'info')
    await new Promise(r => setTimeout(r, 1000))
    setStatuses(s => ({ ...s, load: 'done' }))
    addLog('Cargar CRM', 'Carga completada', 'success')

    // 5. Report
    setStatuses(s => ({ ...s, report: 'running' })); setActiveStep('report')
    await new Promise(r => setTimeout(r, 600))
    const rep = generateReport(transformed)
    setReport(rep); setStatuses(s => ({ ...s, report: 'done' })); setActiveStep('report')
    addLog('Informe', `Total neto: ${rep.totalNeto.toFixed(2)}€, Margen: ${rep.totalMargen.toFixed(2)}€`, 'success')
    addLog('pipeline', 'Pipeline finalizado con exito.', 'success')
    setRunning(false)
  }, [addLog])

  const reset = () => { setRunning(false); setStatuses({}); setLogs([]); setActiveStep(null); setRawRows([]); setValidatedRows([]); setTransformedRows([]); setReport(null) }

  const StatusIcon = ({ s }: { s: StepStatus | undefined }) => {
    if (s === 'done') return <CheckCircle size={16} className="text-green-500" />
    if (s === 'running') return <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin-slow" />
    return <Clock size={16} className="text-muted/40" />
  }

  const tableData: RawRow[] = activeStep === 'validate' ? validatedRows
    : (activeStep === 'transform' || activeStep === 'load' || activeStep === 'report') ? transformedRows : rawRows

  const tableKeys = activeStep === 'validate'
    ? ['fecha', 'producto', 'cantidad', 'precio', 'vendedor', '_valid', '_errors']
    : (activeStep === 'transform' || activeStep === 'load' || activeStep === 'report')
      ? ['fecha', 'producto', 'cantidad', 'precio', 'region', 'importe_bruto', 'importe_neto', 'margen_est']
      : ['fecha', 'producto', 'codigo', 'cantidad', 'precio', 'descuento', 'region', 'vendedor']

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t('pipeline_page.title')}</h1>
        <p className="text-muted">{t('pipeline_page.subtitle')}</p>
      </div>

      <div className="flex gap-3 items-center mb-6 flex-wrap">
        <button onClick={run} disabled={running} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
          <Play size={16} /> {t('pipeline_page.run')}
        </button>
        <button onClick={reset} disabled={running && !report} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-border text-white hover:bg-white/5 transition-colors disabled:opacity-40">
          <RotateCcw size={16} /> {t('pipeline_page.reset')}
        </button>
        {transformedRows.length > 0 && (
          <button onClick={() => exportCSV(transformedRows)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-border text-white hover:bg-white/5 transition-colors">
            <Download size={16} /> {t('pipeline_page.export_csv')}
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 overflow-x-auto pb-4 mb-6">
        {STEP_IDS.map((step, i) => (
          <div key={step.id} className="flex flex-col sm:flex-row items-center gap-2">
            <button onClick={() => statuses[step.id] === 'done' && setActiveStep(step.id)}
              className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 w-full sm:w-auto sm:min-w-[130px] rounded-xl border transition-all text-center bg-card ${
                statuses[step.id] === 'running' ? 'border-accent shadow-[0_0_15px_var(--color-accent-glow)]' :
                statuses[step.id] === 'done' ? 'border-green-500/30 cursor-pointer hover:border-green-500' : 'border-border'}`}>
              <StatusIcon s={statuses[step.id]} />
              <strong className="text-xs">{t(step.labelKey)}</strong>
            </button>
            {i < STEP_IDS.length - 1 && <ArrowRight size={18} className="text-muted/30 shrink-0 rotate-90 sm:rotate-0" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4">
        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <h3 className="text-sm font-semibold">
              {activeStep === 'validate' ? t('pipeline_page.validation') : activeStep === 'transform' || activeStep === 'load' ? t('pipeline_page.transformed') : activeStep === 'report' ? t('pipeline_page.finals') : t('pipeline_page.raw_data')}
              {tableData.length > 0 && <span className="text-muted font-normal ml-2">({tableData.length} {t('pipeline_page.rows')})</span>}
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            {tableData.length === 0 ? (
              <p className="text-muted text-sm p-8 text-center">{t('pipeline_page.run_to_see')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr>{tableKeys.map(k => <th key={k} className="bg-white/[0.03] px-3 py-2 text-left text-xs uppercase tracking-wide text-muted border-b border-border whitespace-nowrap font-semibold">{k}</th>)}</tr></thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      {tableKeys.map(k => (
                        <td key={k} className={`px-3 py-1.5 border-b border-white/[0.03] whitespace-nowrap ${k === '_valid' && row[k] === 'no' ? 'text-red-400' : k === '_valid' && row[k] === 'si' ? 'text-green-400' : k === '_errors' && row[k] !== '-' ? 'text-red-400 text-xs' : ''}`}>
                          {row[k] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Logs + Report */}
        <div className="flex flex-col gap-4">
          {report && (
            <div className="bg-card border border-green-500/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-green-400">{t('pipeline_page.final_report')}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted text-xs block">{t('pipeline_page.processed_rows')}</span><strong>{report.totalRows}</strong></div>
                <div><span className="text-muted text-xs block">{t('pipeline_page.total_net')}</span><strong>{report.totalNeto.toFixed(2)}€</strong></div>
                <div><span className="text-muted text-xs block">{t('pipeline_page.est_margin')}</span><strong>{report.totalMargen.toFixed(2)}€</strong></div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-muted text-xs block mb-1">{t('pipeline_page.by_region')}</span>
                {Object.entries(report.byRegion).map(([r, v]) => (
                  <div key={r} className="flex justify-between text-xs text-muted"><span>{r}</span><span className="text-white">{v.toFixed(2)}€</span></div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl overflow-hidden flex-1">
            <div className="flex justify-between px-3 py-2 border-b border-border text-sm"><strong>{t('pipeline_page.logs')}</strong><span className="text-xs text-muted">{logs.length}</span></div>
            <div ref={logRef} className="h-52 overflow-y-auto p-2 font-mono text-xs space-y-0.5">
              {logs.length === 0 && <p className="text-muted text-center py-8 font-sans">{t('pipeline_page.run_pipeline')}</p>}
              {logs.map((l, i) => (
                <div key={i} className={`flex gap-2 px-2 py-0.5 rounded ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : l.type === 'warn' ? 'text-yellow-400' : 'text-muted'}`}>
                  <span className="text-muted shrink-0">{l.time}</span>
                  <span className="text-accent shrink-0 min-w-[80px]">[{l.step}]</span>
                  <span>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
