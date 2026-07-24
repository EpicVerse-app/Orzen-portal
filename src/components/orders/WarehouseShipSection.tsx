'use client'

import { useState, useTransition } from 'react'
import { Truck, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import VendorShipPhotoUpload from './VendorShipPhotoUpload'
import toast from 'react-hot-toast'

interface Props {
  orderId:          string
  companyId:        string
  branchId:         string
  orderNumber:      string
  initialStatus:    string
  shippedPhotoUrl?: string | null
}

export default function WarehouseShipSection({
  orderId, companyId, branchId, orderNumber, initialStatus, shippedPhotoUrl,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [pending, start]    = useTransition()

  async function markShipped() {
    start(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', orderId)

      if (error) {
        toast.error('Failed to update status.')
        return
      }

      await sendOrderNotifications({
        orderId,
        companyId,
        title:       'Order Shipped',
        message:     `Order ${orderNumber} has been shipped`,
        type:        'order_shipped',
        targetRoles: ['store_head', 'store_manager'],
        branchId,
      })

      toast.success('Order marked as shipped!')
      setStatus('shipped')
    })
  }

  if (status === 'delivered') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-100">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-sm font-semibold text-green-700">Order Delivered</span>
      </div>
    )
  }

  if (status === 'shipped') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <Truck className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-sm font-semibold text-blue-700">Shipped — awaiting delivery</span>
        </div>
        <div className="px-4 py-4 bg-white rounded-2xl border border-gray-100">
          <VendorShipPhotoUpload
            orderId={orderId}
            companyId={companyId}
            branchId={branchId}
            shortId={orderNumber}
            existingPhotoUrl={shippedPhotoUrl}
          />
        </div>
      </div>
    )
  }

  // approved / assigned state — show ship button
  return (
    <button
      onClick={markShipped}
      disabled={pending}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-40"
    >
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4" />
        {pending ? 'Updating…' : 'Mark as Shipped'}
      </div>
      {pending && <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />}
    </button>
  )
}
