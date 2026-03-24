import { describe, it, expect, beforeEach } from 'vitest'
import { useApiStore } from '../stores/apiStore'

describe('API Store (Zustand) - CRUD', () => {
  beforeEach(() => {
    useApiStore.getState().resetStore()
  })

  it('tiene productos iniciales', () => {
    const { products } = useApiStore.getState()
    expect(products.length).toBe(5)
    expect(products[0].name).toBe('Monitor 27" 4K')
  })

  it('GET - obtiene un producto por ID', () => {
    const product = useApiStore.getState().getProduct(1)
    expect(product).toBeDefined()
    expect(product?.name).toBe('Monitor 27" 4K')
  })

  it('GET - devuelve undefined si no existe', () => {
    const product = useApiStore.getState().getProduct(999)
    expect(product).toBeUndefined()
  })

  it('POST - crea un producto nuevo', () => {
    const store = useApiStore.getState()
    const product = store.addProduct({ name: 'Webcam 4K', price: 120, stock: 30, category: 'electronica' })

    expect(product.id).toBeGreaterThan(5)
    expect(product.name).toBe('Webcam 4K')
    expect(useApiStore.getState().products).toHaveLength(6)
  })

  it('PUT - actualiza un producto existente', () => {
    const store = useApiStore.getState()
    const updated = store.updateProduct(1, { price: 250, stock: 50 })

    expect(updated).not.toBeNull()
    expect(updated?.price).toBe(250)
    expect(updated?.stock).toBe(50)
    expect(updated?.name).toBe('Monitor 27" 4K') // sin cambiar
  })

  it('PUT - devuelve null si no existe', () => {
    const result = useApiStore.getState().updateProduct(999, { price: 1 })
    expect(result).toBeNull()
  })

  it('DELETE - elimina un producto', () => {
    const store = useApiStore.getState()
    const deleted = store.deleteProduct(1)

    expect(deleted?.name).toBe('Monitor 27" 4K')
    expect(useApiStore.getState().products).toHaveLength(4)
    expect(useApiStore.getState().getProduct(1)).toBeUndefined()
  })

  it('DELETE - devuelve null si no existe', () => {
    const result = useApiStore.getState().deleteProduct(999)
    expect(result).toBeNull()
  })
})
