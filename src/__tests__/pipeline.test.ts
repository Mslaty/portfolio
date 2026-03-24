import { describe, it, expect } from 'vitest'
import { parseCSV, validateRows, transformRows, generateReport } from '../services/pipeline'

const SAMPLE_CSV = `fecha;producto;codigo;cantidad;precio;descuento;region;vendedor
15/01/2024;Monitor 4K;MON-001;3;279.99;5;Canarias;Ana Lopez
16/01/2024;Teclado RGB;TEC-042;;79.90;0;Peninsula;Carlos Ruiz
17/01/2024;Webcam HD;WEB-003;1;-45.00;0;Peninsula;Carlos Ruiz
18/01/2024;Hub USB-C;HUB-008;5;59.99;0;Canarias;Maria Diaz`

describe('Pipeline ETL - parseCSV', () => {
  it('parsea CSV con separador ; correctamente', () => {
    const rows = parseCSV(SAMPLE_CSV)
    expect(rows).toHaveLength(4)
    expect(rows[0].producto).toBe('Monitor 4K')
    expect(rows[0].precio).toBe('279.99')
  })

  it('maneja campos vacios', () => {
    const rows = parseCSV(SAMPLE_CSV)
    expect(rows[1].cantidad).toBe('')
  })
})

describe('Pipeline ETL - validateRows', () => {
  it('marca como invalida una fila sin cantidad', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const teclado = validated.find(r => r.producto === 'Teclado RGB')
    expect(teclado?._valid).toBe('no')
    expect(teclado?._errors).toContain('cantidad invalida')
  })

  it('marca como invalida una fila con precio negativo', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const webcam = validated.find(r => r.producto === 'Webcam HD')
    expect(webcam?._valid).toBe('no')
    expect(webcam?._errors).toContain('precio invalido')
  })

  it('marca como valida una fila correcta', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const monitor = validated.find(r => r.producto === 'Monitor 4K')
    expect(monitor?._valid).toBe('si')
  })
})

describe('Pipeline ETL - transformRows', () => {
  it('calcula importe bruto y neto correctamente', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const transformed = transformRows(validated)

    const monitor = transformed.find(r => r.producto === 'Monitor 4K')
    expect(monitor).toBeDefined()
    // 3 * 279.99 = 839.97
    expect(Number(monitor!.importe_bruto)).toBeCloseTo(839.97, 2)
    // 839.97 * (1 - 5/100) = 797.97
    expect(Number(monitor!.importe_neto)).toBeCloseTo(797.97, 1)
  })

  it('filtra filas invalidas', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const transformed = transformRows(validated)
    // Solo Monitor y Hub son validos
    expect(transformed).toHaveLength(2)
  })

  it('normaliza formato de fecha DD/MM/YYYY a YYYY-MM-DD', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const transformed = transformRows(validated)
    expect(transformed[0].fecha).toBe('2024-01-15')
  })
})

describe('Pipeline ETL - generateReport', () => {
  it('genera totales correctos', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const transformed = transformRows(validated)
    const report = generateReport(transformed)

    expect(report.totalRows).toBe(2)
    expect(report.totalNeto).toBeGreaterThan(0)
    expect(report.totalMargen).toBeCloseTo(report.totalNeto * 0.35, 1)
  })

  it('agrupa por region', () => {
    const rows = parseCSV(SAMPLE_CSV)
    const validated = validateRows(rows)
    const transformed = transformRows(validated)
    const report = generateReport(transformed)

    expect(report.byRegion).toHaveProperty('Canarias')
    expect(report.byRegion['Canarias']).toBeGreaterThan(0)
  })
})
