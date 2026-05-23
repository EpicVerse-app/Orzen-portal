'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, ShoppingCart, MapPin, Package, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

const NORMAL_MAX_QTY = 10

interface Branch {
  name: string
  address: string
  city: string
  state: string
}

interface Props {
  branchId: string
  companyId: string
  userId: string
  branch: Branch
}

export default function ViewOrderPage({ branchId, companyId, userId, branch }: Props) {
  const { items, removeItem, updateQty, clearCart, totalItems } = useCartStore()
  const [submitting, setSubmitting]     = useState(false)
  const [showWarning, setShowWarning]   = useState(false)
  const [overQtyItems, setOverQtyItems] = useState<{ name: string; quantity: number }[]>([])
  const router = useRouter()

  // Called when user clicks "Place Order" — check qty first
  function handlePlaceOrderClick() {
    const overLimit = items
      .filter(i => i.quantity > NORMAL_MAX_QTY)
      .map(i => ({ name: i.product.name, quantity: i.quantity }))

    if (overLimit.length > 0) {
      setOverQtyItems(overLimit)
      setShowWarning(true)
    } else {
      placeOrder()
    }
  }

  async function placeOrder() {
    setShowWarning(false)
    if (items.length === 0) return
    setSubmitting(true)

    const supabase = createClient()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        branch_id: branchId,
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
    router.push('/dashboard/store')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">View Order</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{branch?.name} — {branch?.address}, {branch?.city}</span>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No items in your order</h3>
          <p className="text-sm text-gray-400 mb-6">Go to the catalogue and add products</p>
          <Link
            href="/dashboard/store/catalogue"
            className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <>
          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Order Items ({items.length} product{items.length !== 1 ? 's' : ''})
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
                <div key={item.product.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Product image */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
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
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">{item.product.categoryName}</p>
                  </div>

                  {/* Qty input */}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                  />

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Total products</span>
              <span className="font-semibold text-gray-900">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total quantity</span>
              <span className="font-semibold text-gray-900">{totalItems()} items</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/store/catalogue"
              className="flex-1 text-center border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Add More
            </Link>
            <button
              onClick={handlePlaceOrderClick}
              disabled={submitting}
              className="flex-1 bg-[#1a1a1a] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
            >
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}

      {/* ── High-quantity warning modal ──────────────────────── */}
      {showWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

            {/* Header */}
            <div className="bg-amber-50 px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Check Quantities Before Ordering</h2>
                <p className="text-sm text-amber-700 mt-0.5">
                  Some items are above the usual order quantity
                </p>
              </div>
              <button onClick={() => setShowWarning(false)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product list */}
            <div className="px-6 py-4 space-y-3">
              {overQtyItems.map((item) => (
                <div key={item.name} className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Normally this branch orders{' '}
                    <span className="font-bold">10 quantity</span> of{' '}
                    <span className="font-bold text-amber-700">{item.name}</span>.
                    You have entered{' '}
                    <span className="font-bold text-red-600">{item.quantity}</span>.
                    Please check before placing the order.
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Go Back & Edit
              </button>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
              >
                {submitting ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
