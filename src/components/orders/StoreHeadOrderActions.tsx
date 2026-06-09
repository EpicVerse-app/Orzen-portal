'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'

interface Props {
  orderId:   string
  companyId: string
  approverId: string
  branchId?: string
}

export default function StoreHeadOrderActions({ orderId, companyId, approverId, branchId }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  async function handle(action: 'approved' | 'rejected') {
    setProcessing(action)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: action, approved_by: approverId, approved_by_role: 'store_head' })
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
      title:       action === 'approved' ? 'Order Approved' : 'Order Rejected',
      message:     `Order ${sid} has been ${action}`,
      type:        `order_${action}`,
      targetRoles: action === 'approved' ? ['vendor', 'store_manager'] : ['store_manager'],
      branchId,
    })

    toast.success(action === 'approved' ? 'Order approved ✓' : 'Order rejected')
    router.push('/dashboard/store-head/requests')
    router.refresh()
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handle('rejected')}
        disabled={!!processing}
        className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        {processing === 'rejected'
          ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          : <XCircle className="w-4 h-4" />}
        Reject
      </button>
      <button
        onClick={() => handle('approved')}
        disabled={!!processing}
        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
      >
        {processing === 'approved'
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <CheckCircle className="w-4 h-4" />}
        Approve
      </button>
    </div>
  )
}
