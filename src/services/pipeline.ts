export interface RawRow { [key: string]: string }
export interface ValidatedRow extends RawRow { _valid: string; _errors: string }
export interface TransformedRow extends RawRow { importe_bruto: string; importe_neto: string; margen_est: string }

export interface PipelineReport {
  totalNeto: number
  totalMargen: number
  totalRows: number
  byRegion: Record<string, number>
  byVendedor: Record<string, number>
}

export function parseCSV(csv: string): RawRow[] {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(';').map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = line.split(';')
    const row: RawRow = {}
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim() })
    return row
  })
}

export function validateRows(rows: RawRow[]): ValidatedRow[] {
  return rows.map(row => {
    const errors: string[] = []
    if (!row.cantidad || isNaN(Number(row.cantidad)) || Number(row.cantidad) <= 0)
      errors.push('cantidad invalida')
    if (!row.precio || isNaN(Number(row.precio)) || Number(row.precio) <= 0)
      errors.push('precio invalido')
    if (!row.vendedor)
      errors.push('vendedor vacio')
    if (!row.fecha)
      errors.push('fecha vacia')
    return { ...row, _valid: errors.length === 0 ? 'si' : 'no', _errors: errors.join(', ') || '-' }
  })
}

export function transformRows(rows: ValidatedRow[]): TransformedRow[] {
  return rows
    .filter(r => r._valid === 'si')
    .map(row => {
      const cant = Number(row.cantidad)
      const precio = Number(row.precio)
      const dto = Number(row.descuento) || 0
      const bruto = cant * precio
      const neto = bruto * (1 - dto / 100)
      const margen = neto * 0.35
      return {
        ...row,
        fecha: row.fecha.split('/').reverse().join('-'),
        importe_bruto: bruto.toFixed(2),
        importe_neto: neto.toFixed(2),
        margen_est: margen.toFixed(2),
      }
    })
}

export function generateReport(rows: TransformedRow[]): PipelineReport {
  const totalNeto = rows.reduce((s, r) => s + Number(r.importe_neto), 0)
  const totalMargen = rows.reduce((s, r) => s + Number(r.margen_est), 0)
  const byRegion: Record<string, number> = {}
  const byVendedor: Record<string, number> = {}
  rows.forEach(r => {
    byRegion[r.region] = (byRegion[r.region] || 0) + Number(r.importe_neto)
    byVendedor[r.vendedor] = (byVendedor[r.vendedor] || 0) + Number(r.importe_neto)
  })
  return { totalNeto, totalMargen, totalRows: rows.length, byRegion, byVendedor }
}

function sanitizeCsvCell(v: string): string {
  const s = String(v).replace(/"/g, '""')
  return /^[=+\-@\t\r]/.test(s) ? `"'${s}"` : `"${s}"`
}

export function exportCSV(rows: TransformedRow[]): void {
  const keys = ['fecha', 'producto', 'codigo', 'cantidad', 'precio', 'descuento', 'region', 'vendedor', 'importe_bruto', 'importe_neto', 'margen_est']
  const csv = '\uFEFF' + keys.join(',') + '\n' + rows.map(r => keys.map(k => sanitizeCsvCell(r[k] || '')).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'pipeline_output.csv'
  a.click()
}
