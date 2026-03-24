import { create } from 'zustand'

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

interface ApiStore {
  products: Product[]
  addProduct: (p: Omit<Product, 'id'>) => Product
  updateProduct: (id: number, data: Partial<Product>) => Product | null
  deleteProduct: (id: number) => Product | null
  getProduct: (id: number) => Product | undefined
  resetStore: () => void
}

const INITIAL: Product[] = [
  { id: 1, name: 'Monitor 27" 4K', price: 280, stock: 42, category: 'electronica' },
  { id: 2, name: 'Teclado mecanico RGB', price: 80, stock: 156, category: 'electronica' },
  { id: 3, name: 'Auriculares BT Pro', price: 90, stock: 78, category: 'electronica' },
  { id: 4, name: 'Silla ergonomica', price: 350, stock: 23, category: 'mobiliario' },
  { id: 5, name: 'Hub USB-C', price: 60, stock: 200, category: 'accesorios' },
]

let nextId = 6

export const useApiStore = create<ApiStore>()((set, get) => ({
  products: INITIAL,

  addProduct: (data) => {
    const product: Product = { ...data, id: nextId++ }
    set(s => ({ products: [...s.products, product] }))
    return product
  },

  updateProduct: (id, data) => {
    const idx = get().products.findIndex(p => p.id === id)
    if (idx === -1) return null
    const updated = { ...get().products[idx], ...data }
    set(s => {
      const products = [...s.products]
      products[idx] = updated
      return { products }
    })
    return updated
  },

  deleteProduct: (id) => {
    const product = get().products.find(p => p.id === id)
    if (!product) return null
    set(s => ({ products: s.products.filter(p => p.id !== id) }))
    return product
  },

  getProduct: (id) => get().products.find(p => p.id === id),

  resetStore: () => { nextId = 6; set({ products: INITIAL }) },
}))
