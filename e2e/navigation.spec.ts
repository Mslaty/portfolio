import { test, expect } from '@playwright/test'

test.describe('Portfolio Navigation', () => {
  test('carga la landing y muestra el hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Frontend Developer')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('navega a la demo OCR', async ({ page }) => {
    await page.goto('/')
    await page.click('text=OCR Demo')
    await expect(page).toHaveURL(/\/ocr/)
    await expect(page.locator('h1')).toContainText('Extractor de Facturas')
  })

  test('navega a la demo Chat', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.locator('h1')).toContainText('Chat Multi-Agente')
    // Verifica que los 3 agentes estan visibles
    await expect(page.locator('text=Asistente General')).toBeVisible()
    await expect(page.locator('text=Agente Ventas')).toBeVisible()
    await expect(page.locator('text=Agente Soporte')).toBeVisible()
  })

  test('kanban permite crear una tarea', async ({ page }) => {
    await page.goto('/kanban')
    await page.click('text=Anadir tarea >> nth=0')
    await page.fill('input[placeholder="Titulo..."]', 'Tarea de Playwright')
    await page.click('text=Anadir >> button')
    await expect(page.locator('text=Tarea de Playwright')).toBeVisible()
  })

  test('API demo cambia de rol y muestra 403', async ({ page }) => {
    await page.goto('/api')
    // Cambiar a viewer
    await page.click('text=viewer')
    // Intentar DELETE
    await page.click('text=DELETE >> nth=0')
    await expect(page.locator('text=403')).toBeVisible()
  })
})
