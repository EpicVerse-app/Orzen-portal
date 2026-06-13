import { create } from 'zustand'

export interface CartProduct {
  id: string
  name: string
  image_url: string | null
  unit: string
  price?: number | null
  categoryName: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  selectedBranchId: string
  userId: string
  initForUser: (userId: string) => void
  setSelectedBranchId: (id: string) => void
  setOpen: (open: boolean) => void
  addItem: (product: CartProduct, quantity: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
}

function loadFromStorage(userId: string): { items: CartItem[]; selectedBranchId: string } {
  if (typeof window === 'undefined' || !userId) return { items: [], selectedBranchId: '' }
  try {
    const raw = localStorage.getItem(`cart-${userId}`)
    if (!raw) return { items: [], selectedBranchId: '' }
    return JSON.parse(raw)
  } catch {
    return { items: [], selectedBranchId: '' }
  }
}

function saveToStorage(userId: string, items: CartItem[], selectedBranchId: string) {
  if (typeof window === 'undefined' || !userId) return
  localStorage.setItem(`cart-${userId}`, JSON.stringify({ items, selectedBranchId }))
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  selectedBranchId: '',
  userId: '',

  initForUser: (userId: string) => {
    const saved = loadFromStorage(userId)
    set({ userId, items: saved.items, selectedBranchId: saved.selectedBranchId })
  },

  setSelectedBranchId: (id) => set((state) => {
    saveToStorage(state.userId, state.items, id)
    return { selectedBranchId: id }
  }),

  setOpen: (open) => set({ isOpen: open }),

  addItem: (product, quantity) => {
    if (quantity <= 0) return
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      const newItems = existing
        ? state.items.map((i) => i.product.id === product.id ? { ...i, quantity } : i)
        : [...state.items, { product, quantity }]
      saveToStorage(state.userId, newItems, state.selectedBranchId)
      return { items: newItems }
    })
  },

  removeItem: (productId) => set((state) => {
    const newItems = state.items.filter((i) => i.product.id !== productId)
    saveToStorage(state.userId, newItems, state.selectedBranchId)
    return { items: newItems }
  }),

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => {
      const newItems = state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
      saveToStorage(state.userId, newItems, state.selectedBranchId)
      return { items: newItems }
    })
  },

  clearCart: () => {
    const { userId } = get()
    if (userId) localStorage.removeItem(`cart-${userId}`)
    set({ items: [], selectedBranchId: '' })
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
