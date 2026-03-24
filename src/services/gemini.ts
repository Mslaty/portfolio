const STORAGE_KEY = 'portfolio_gemini_key'

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function saveApiKey(key: string): void {
  const trimmed = key.trim()
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed)
  else localStorage.removeItem(STORAGE_KEY)
}

export function deleteApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export interface GeminiRequestOptions {
  apiKey: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

export async function callGemini(
  contents: object[],
  options: GeminiRequestOptions,
): Promise<string> {
  const model = options.model || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': options.apiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
      },
    }),
  })

  if (!res.ok) {
    if (res.status === 429) throw new Error('Rate limit alcanzado. Espera un momento.')
    if (res.status === 403) throw new Error('API key invalida o sin permisos.')
    const err = await res.json().catch(() => ({}))
    throw new Error((err as Record<string, Record<string, string>>)?.error?.message || `Error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function callGeminiChat(
  apiKey: string,
  systemPrompt: string,
  history: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
): Promise<string> {
  const contents = [
    { role: 'user', parts: [{ text: `INSTRUCCIONES: ${systemPrompt}` }] },
    { role: 'model', parts: [{ text: 'Entendido.' }] },
    ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  return callGemini(contents, { apiKey, temperature: 0.7, maxOutputTokens: 256 })
}

export async function callGeminiOCR(
  apiKey: string,
  pdfBase64: string,
  prompt: string,
): Promise<string[][]> {
  const contents = [{
    parts: [
      { text: prompt },
      { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
    ],
  }]

  const text = await callGemini(contents, { apiKey, temperature: 0.1, maxOutputTokens: 8192 })

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No se pudo extraer datos. Verifica que sea una factura legible.')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new Error('Respuesta del modelo no es JSON valido.')
  }

  if (!Array.isArray(parsed) || !parsed.length) throw new Error('Sin lineas detectables.')

  // Strict schema validation: must be array of arrays of strings
  const validated: string[][] = parsed.map((row: unknown, i: number) => {
    if (!Array.isArray(row)) throw new Error(`Fila ${i + 1} no es un array.`)
    return row.map((cell: unknown) => (typeof cell === 'string' ? cell : String(cell ?? '')))
  })

  return validated
}
