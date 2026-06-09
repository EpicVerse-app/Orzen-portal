'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'

interface Props {
  orderId: string
  companyId: string
  branchId?: string
}

export default function VendorOrderActions({ orderId, companyId, branchId }: Props) {
  const [shipping, setShipping] = useState(false)
  const router = useRouter()

  async function markShipped() {
    setShipping(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update status.')
      setShipping(false)
      return
    }

    const sid = 'ORD-' + orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Shipped',
      message:     `Order ${sid} has been shipped`,
      type:        'order_shipped',
      targetRoles: ['store_head', 'store_manager'],
      branchId,
    })

    toast.success('Order marked as shipped!')
    router.push('/dashboard/vendor')
    router.refresh()
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={markShipped}
        disabled={shipping}
        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
      >
        {shipping
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Truck className="w-4 h-4" />}
        {shipping ? 'Updating…' : 'Mark as Shipped'}
      </button>
    </div>
  )
}
