import { create } from 'zustand'

export interface CartProduct {
  id: string
  name: string
  image_url: string | null
  unit: string
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
  setSelectedBranchId: (id: string) => void
  setOpen: (open: boolean) => void
  addItem: (product: CartProduct, quantity: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  selectedBranchId: '',
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),
  setOpen: (open) => set({ isOpen: open }),

  addItem: (product, quantity) => {
    if (quantity <= 0) return
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity } : i
          ),
        }
      }
      return { items: [...state.items, { product, quantity }] }
    })
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    }))
  },

  clearCart: () => set({ items: [], selectedBranchId: '' }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
