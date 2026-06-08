'use client'

import { useState } from 'react'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  branchId:  string
  companyId: string
  userId:    string
}

export default function CartBar({ branchId, companyId, userId }: Props) {
  const { items, removeItem, updateQty, clearCart, totalItems, isOpen, setOpen } = useCartStore()
  const open = isOpen
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const total = totalItems()
  if (total === 0 && !open) return null

  async function placeOrder() {
    if (items.length === 0) return
    setSubmitting(true)

    const supabase = createClient()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        branch_id:  branchId,
        created_by: userId,
        status:     'submitted',
        escalation_deadline: deadline.toISOString(),
      })
      .select('id')
      .single()

    if (error || !order) {
      toast.error('Failed to place order. Try again.')
      setSubmitting(false)
      return
    }

    const orderItems = items.map((i) => ({
      order_id:   order.id,
      product_id: i.product.id,
      quantity:   i.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      toast.error('Failed to save order items.')
      setSubmitting(false)
      return
    }

    clearCart()
    setOpen(false)
    toast.success('Order placed successfully!')
    router.push('/dashboard/store/orders')
    router.refresh()
  }

  return (
    <>
      {/* Floating cart button */}
      {!open && total > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[84px] lg:bottom-6 right-4 lg:right-6 z-50 bg-[#1a1a1a] text-white flex items-center gap-2 px-5 py-3 rounded-full shadow-lg hover:bg-[#2a2a2a] transition-colors active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-sm font-semibold">View Order</span>
          <span className="bg-[#c9a84c] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {items.length}
          </span>
        </button>
      )}

      {/* Order panel */}
      {open && (
        <div className="fixed bottom-0 right-0 left-0 lg:left-auto lg:w-96 z-50 bg-white border-t lg:border border-gray-200 lg:rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">Your Order</h3>
              <span className="text-xs text-gray-400">{items.length} product{items.length !== 1 ? 's' : ''}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No items added yet</p>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400">{item.product.categoryName}</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 0)}
                    className="w-16 h-10 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                  />
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total items</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { clearCart(); setOpen(false) }}
                className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={placeOrder}
                disabled={submitting || items.length === 0}
                className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
