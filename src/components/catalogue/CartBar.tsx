'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, X, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  branchId:   string
  companyId:  string
  userId:     string
  branchName?: string
}

export default function CartBar({ branchId, companyId, userId, branchName }: Props) {
  const { items, removeItem, updateQty, clearCart, totalItems, isOpen, setOpen, initForUser } = useCartStore()
  const open = isOpen
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { initForUser(userId) }, [userId])
  const [showModal, setShowModal] = useState(false)
  const [orderedByName, setOrderedByName] = useState('')
  const [orderedById, setOrderedById] = useState('')
  const router = useRouter()

  const total = totalItems()
  if (total === 0 && !open) return null

  async function placeOrder() {
    if (items.length === 0) return
    if (!orderedByName.trim() || !orderedById.trim()) return
    setShowModal(false)
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
        ordered_by_name: orderedByName.trim(),
        ordered_by_id:   orderedById.trim(),
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

    const sid = 'ORD-' + order.id.replace(/-/g, '').slice(0, 6).toUpperCase()
    await sendOrderNotifications({
      orderId:     order.id,
      companyId,
      title:       'New Order Submitted',
      message:     `Order ${sid}${branchName ? ` from ${branchName}` : ''} is waiting for approval`,
      type:        'order_submitted',
      targetRoles: ['store_head'],
      branchId,
    })

    clearCart()
    setOpen(false)
    toast.success('Order placed successfully!')
    window.location.href = '/dashboard/store/orders'
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
                onClick={() => setShowModal(true)}
                disabled={submitting || items.length === 0}
                className="flex-1 bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ordered-by modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Confirm Order</h2>
            <p className="text-sm text-gray-400 mb-5">Enter your name and ID to place this order.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={orderedByName}
                  onChange={e => setOrderedByName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your ID</label>
                <input
                  type="text"
                  value={orderedById}
                  onChange={e => setOrderedById(e.target.value)}
                  placeholder="Employee / Staff ID"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                disabled={!orderedByName.trim() || !orderedById.trim()}
                className="flex-1 bg-[#1a1a1a] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
              >
                Confirm & Place
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
