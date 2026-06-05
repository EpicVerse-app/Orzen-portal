'use client'

import { useState } from 'react'
import { ShoppingCart, Check, AlertTriangle, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'
import ImageCarousel from '@/components/ui/ImageCarousel'

const NORMAL_MAX_QTY = 10

interface Product {
  id: string
  name: string
  unit: string
  image_url: string | null
  image_url_2?: string | null
  image_url_3?: string | null
  categoryName: string
}

interface Props {
  products: Product[]
}

export default function ProductGrid({ products }: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const { addItem, items } = useCartStore()

  // Warning modal state
  const [warning, setWarning] = useState<{ product: Product; qty: number } | null>(null)

  function handleQtyChange(productId: string, value: string) {
    if (value === '' || /^\d+$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [productId]: value }))
    }
  }

  function handleAddToOrder(product: Product) {
    const qty = parseInt(quantities[product.id] || '0')
    if (!qty || qty <= 0) {
      toast.error('Enter a quantity first')
      return
    }

    // Show warning if qty exceeds normal limit
    if (qty > NORMAL_MAX_QTY) {
      setWarning({ product, qty })
      return
    }

    confirmAdd(product, qty)
  }

  function confirmAdd(product: Product, qty: number) {
    addItem(product, qty)
    toast.success(`${product.name} added to order`)
    setWarning(null)
  }

  function getCartQty(productId: string) {
    return items.find((i) => i.product.id === productId)?.quantity || 0
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-16 text-center">
        <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No products in this category yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => {
          const cartQty  = getCartQty(product.id)
          const isInCart = cartQty > 0

          return (
            <div
              key={product.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                isInCart ? 'border-[#c9a84c]' : 'border-gray-100'
              }`}
            >
              {isInCart && (
                <div className="bg-[#c9a84c] text-black text-xs font-semibold px-2 py-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Added × {cartQty}
                </div>
              )}

              <ImageCarousel
                images={[product.image_url, product.image_url_2, product.image_url_3]}
                alt={product.name}
                className="aspect-square"
                size={200}
              />

              <div className="p-3 space-y-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>

                <input
                  type="number"
                  min="1"
                  value={quantities[product.id] || ''}
                  onChange={(e) => handleQtyChange(product.id, e.target.value)}
                  placeholder="Qty"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
                />

                <button
                  onClick={() => handleAddToOrder(product)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isInCart
                      ? 'bg-[#c9a84c]/20 text-[#8a6f2e] hover:bg-[#c9a84c]/30'
                      : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {isInCart ? 'Update' : 'Add to Order'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── High-quantity warning modal ──────────────────── */}
      {warning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

            {/* Header */}
            <div className="bg-amber-50 px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Check Quantity</h2>
                <p className="text-sm text-amber-700 mt-0.5">This is above the usual order quantity</p>
              </div>
              <button onClick={() => setWarning(null)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-relaxed">
                  Normally this branch orders{' '}
                  <span className="font-bold">10 quantity</span> of{' '}
                  <span className="font-bold text-amber-700">{warning.product.name}</span>.
                  You have entered{' '}
                  <span className="font-bold text-red-600">{warning.qty}</span>.{' '}
                  Please check before adding to order.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setWarning(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Go Back & Edit
              </button>
              <button
                onClick={() => confirmAdd(warning.product, warning.qty)}
                className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
