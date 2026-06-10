'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'

interface Props {
  orderId:    string
  companyId:  string
  approverId: string
  branchId?:  string
}

export default function StoreHeadOrderActions({ orderId, companyId, approverId, branchId }: Props) {
  const [processing, setProcessing]       = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason]   = useState('')
  const router = useRouter()

  async function handleApprove() {
    setProcessing('approved')
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: 'approved', approved_by: approverId, approved_by_role: 'store_head' })
      .eq('id', orderId)

    if (error) {
      toast.error('Action failed. Try again.')
      setProcessing(null)
      return
    }

    const sid = 'ORD-' + orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Approved',
      message:     `Order ${sid} has been approved`,
      type:        'order_approved',
      targetRoles: ['vendor', 'store_manager'],
      branchId,
    })

    toast.success('Order approved ✓')
    router.push('/dashboard/store-head/requests')
    router.refresh()
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim()) return
    setProcessing('rejected')
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        status:           'rejected',
        approved_by:      approverId,
        approved_by_role: 'store_head',
        rejection_reason: rejectReason.trim(),
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Action failed. Try again.')
      setProcessing(null)
      return
    }

    const sid = 'ORD-' + orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Rejected',
      message:     `Order ${sid} was rejected: ${rejectReason.trim()}`,
      type:        'order_rejected',
      targetRoles: ['store_manager'],
      branchId,
    })

    toast.success('Order rejected')
    router.push('/dashboard/store-head/requests')
    router.refresh()
  }

  return (
    <>
      {/* ── Action buttons ── */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={!!processing}
          className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={!!processing}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
        >
          {processing === 'approved'
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <CheckCircle className="w-4 h-4" />}
          Approve
        </button>
      </div>

      {/* ── Reject reason modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" style={{ backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

            {/* Header */}
            <div className="bg-red-50 px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">Reject Order</h2>
                <p className="text-sm text-red-600 mt-0.5">Please tell the store manager why this order is rejected</p>
              </div>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                disabled={!!processing}
                className="text-gray-400 hover:text-gray-600 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Quantity is too high, wrong products selected, needs revision..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all"
              />
              {rejectReason.trim().length === 0 && (
                <p className="text-xs text-red-500 mt-1.5">Reason is required to reject an order.</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                disabled={!!processing}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || !!processing}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {processing === 'rejected'
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <XCircle className="w-4 h-4" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
