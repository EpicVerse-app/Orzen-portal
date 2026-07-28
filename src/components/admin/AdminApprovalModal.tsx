'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Clock, ChevronDown, ChevronUp, Building2, Tag, ExternalLink } from 'lucide-react'
import { approveVendorAssignment } from '@/app/actions/approveVendor'
import toast from 'react-hot-toast'

interface Item {
  quantity: number
  product: { name: string; unit: string; category: { name: string } | null } | null
}

interface PendingOrder {
  id: string
  base_order_number: string
  created_at: string
  branch: { name: string; city: string } | null
  items: Item[]
  vendorNames: string
}

interface Props {
  pendingOrders: PendingOrder[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminApprovalModal({ pendingOrders: initial }: Props) {
  const [open, setOpen]         = useState(false)
  const [orders, setOrders]     = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [, startApprove]        = useTransition()
  const router                  = useRouter()

  if (orders.length === 0) return null

  function toggle(id: string) {
    setExpanded(prev => (prev === id ? null : id))
  }

  function handleApprove(orderId: string) {
    setApprovingId(orderId)
    startApprove(async () => {
      const result = await approveVendorAssignment(orderId)
      if (result && 'error' in result) {
        toast.error(result.error)
        setApprovingId(null)
        return
      }
      toast.success('PO approved — warehouse notified!')
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setApprovingId(null)
      if (orders.length <= 1) setOpen(false)
    })
  }

  return (
    <>
      {/* Notification banner */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {orders.length}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-amber-800">
              {orders.length} Pending Approval{orders.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600">Vendor assigned — approve to unlock PO generation</p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-amber-500 group-hover:text-amber-700 transition-colors" />
      </button>

      {/* Modal */}
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col rounded-t-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pending Approvals</h2>
                <p className="text-xs text-gray-400 mt-0.5">{orders.length} order{orders.length > 1 ? 's' : ''} awaiting your approval</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {orders.map(order => {
                const isExpanded = expanded === order.id
                const isApproving = approvingId === order.id

                return (
                  <div key={order.id} className="px-5 py-4">
                    {/* Order summary row — single click expands, double click opens full view */}
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer select-none"
                      onClick={() => toggle(order.id)}
                      onDoubleClick={() => {
                        setOpen(false)
                        router.push(`/dashboard/admin/orders/${order.id}`)
                      }}
                      title="Double-click to open full view"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 font-mono">{order.base_order_number}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Awaiting Approval</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          {order.branch && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {order.branch.name}{order.branch.city ? `, ${order.branch.city}` : ''}
                            </span>
                          )}
                          <span>{fmtDate(order.created_at)}</span>
                        </div>
                        {order.vendorNames && (
                          <div className="flex items-center gap-1 mt-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">{order.vendorNames}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                        <span className="text-[9px] text-gray-300 whitespace-nowrap flex items-center gap-0.5">
                          <ExternalLink className="w-2.5 h-2.5" /> double-click
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Items */}
                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2.5 pb-1">
                            Items ({order.items.length})
                          </p>
                          <div className="divide-y divide-gray-100">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2">
                                <div>
                                  <p className="text-xs font-semibold text-gray-700">{item.product?.name || 'Product'}</p>
                                  {item.product?.category?.name && (
                                    <p className="text-[10px] text-gray-400">{item.product.category.name}</p>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-gray-600 shrink-0">
                                  {item.quantity} {item.product?.unit || 'pcs'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Approve button */}
                        <button
                          onClick={() => handleApprove(order.id)}
                          disabled={isApproving}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isApproving ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Approving…</>
                          ) : (
                            <><CheckCircle2 className="w-4 h-4" />Approve & Unlock PO</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
