'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, ShoppingCart, Building2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

interface Branch {
  id: string
  name: string
  city: string
  state: string
}

interface Props {
  companyId: string
  userId: string
  branches: Branch[]
}

export default function SuperViewOrderPage({ companyId, userId, branches }: Props) {
  const { items, removeItem, updateQty, clearCart, totalItems, selectedBranchId, setSelectedBranchId } = useCartStore()
  const [submitting, setSubmitting] = useState(false)

  const totalPrice = items.reduce((sum, i) => {
    const price = i.product.price ?? 0
    return sum + price * i.quantity
  }, 0)
  const hasPrices = items.some(i => (i.product.price ?? 0) > 0)
  const router = useRouter()

  async function placeOrder() {
    if (items.length === 0) return
    if (!selectedBranchId) {
      toast.error('Please select a branch first.')
      return
    }
    setSubmitting(true)

    const supabase = createClient()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        branch_id: selectedBranchId,
        created_by: userId,
        status: 'submitted',
        escalation_deadline: deadline.toISOString(),
      })
      .select('id')
      .single()

    if (error || !order) {
      toast.error('Failed to place order.')
      setSubmitting(false)
      return
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      toast.error('Failed to save items.')
      setSubmitting(false)
      return
    }

    clearCart()
    toast.success('Order placed successfully!')
    router.push('/dashboard/super')
    router.refresh()
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">View Order</h1>
        <p className="text-sm text-gray-500 mt-1">Review your items and place the order</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No items in your order</h3>
          <p className="text-sm text-gray-400 mb-6">Go to the catalogue and add products</p>
          <Link
            href="/dashboard/super/catalogue"
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <>
          {/* Selected store display */}
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Ordering for</p>
              {selectedBranch ? (
                <>
                  <p className="text-sm font-bold text-gray-800 truncate">{selectedBranch.name}</p>
                  <p className="text-xs text-gray-400">{selectedBranch.city}, {selectedBranch.state}</p>
                </>
              ) : (
                <p className="text-sm text-orange-500 font-semibold">No store selected — <a href="/dashboard/super/catalogue" className="underline">go back to select</a></p>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {items.length} product{items.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-500 font-medium"
              >
                Clear all
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <div key={item.product.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                  {/* Product image */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">{(item.product as any).categoryName}</p>
                    {(item.product.price ?? 0) > 0 && (
                      <p className="text-xs font-medium mt-0.5" style={{ color: '#570439' }}>
                        ₹{item.product.price!.toFixed(2)} / {item.product.unit}
                      </p>
                    )}
                  </div>

                  {/* Qty + subtotal */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                      className="w-16 sm:w-20 border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                    />
                    {(item.product.price ?? 0) > 0 && (
                      <p className="text-xs font-bold" style={{ color: '#570439' }}>
                        ₹{(item.product.price! * item.quantity).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Total products</span>
              <span className="font-semibold text-gray-900">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Total quantity</span>
              <span className="font-semibold text-gray-900">{totalItems()} items</span>
            </div>
            {hasPrices && (
              <>
                <div className="border-t border-gray-100 my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-800">Total Price</span>
                  <span className="text-base font-extrabold" style={{ color: '#570439' }}>
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/super/catalogue"
              className="flex-1 text-center border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Add More
            </Link>
            <button
              onClick={placeOrder}
              disabled={submitting || !selectedBranchId}
              className="flex-1 bg-[#1a1a1a] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
            >
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>

          {!selectedBranchId && (
            <p className="text-center text-xs text-orange-500 mt-3">
              ⚠ Select a branch above to enable placing the order
            </p>
          )}
        </>
      )}
    </div>
  )
}
