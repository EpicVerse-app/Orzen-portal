'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, ShoppingCart, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import QuantityWarningModal from '@/components/orders/QuantityWarningModal'
import { NORMAL_MAX_QTY } from '@/lib/constants/order'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  unit: string
  image_url: string | null
  categoryName: string
}

interface Props {
  products: Product[]
}

export default function ProductGrid({ products }: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [qtyWarning, setQtyWarning] = useState<{ name: string; quantity: number } | null>(null)
  const { addItem, items } = useCartStore()

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
    addItem(product, qty)
    toast.success(`${product.name} added to order`)
    if (qty > NORMAL_MAX_QTY) {
      setQtyWarning({ name: product.name, quantity: qty })
    }
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
    {qtyWarning && (
      <QuantityWarningModal
        productName={qtyWarning.name}
        quantity={qtyWarning.quantity}
        onClose={() => setQtyWarning(null)}
      />
    )}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((product) => {
        const cartQty = getCartQty(product.id)
        const isInCart = cartQty > 0

        return (
          <div
            key={product.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
              isInCart ? 'border-[#c9a84c]' : 'border-gray-100'
            }`}
          >
            {/* In cart indicator */}
            {isInCart && (
              <div className="bg-[#c9a84c] text-black text-xs font-semibold px-2 py-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Added × {cartQty}
              </div>
            )}

            {/* Product Image */}
            <div className="aspect-square bg-gray-50 flex items-center justify-center">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-10 h-10 text-gray-200" />
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
              <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>

              {/* Quantity input */}
              <input
                type="number"
                min="1"
                value={quantities[product.id] || ''}
                onChange={(e) => handleQtyChange(product.id, e.target.value)}
                placeholder="Qty"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
              />

              {/* Add to Order button */}
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
    </>
  )
}
