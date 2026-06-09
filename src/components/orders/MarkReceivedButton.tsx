'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  orderId:   string
  companyId: string
  branchId:  string
  shortId:   string
}

export default function MarkReceivedButton({ orderId, companyId, branchId, shortId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReceived() {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to confirm delivery.')
      setLoading(false)
      return
    }

    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Delivered',
      message:     `Order ${shortId} has been received`,
      type:        'order_delivered',
      targetRoles: ['super_manager', 'vendor'],
      branchId,
    })

    toast.success('Delivery confirmed!')
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleReceived}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40"
    >
      {loading ? (
        <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Confirming…</>
      ) : (
        <><CheckCircle className="w-4 h-4" />Mark as Received</>
      )}
    </button>
  )
}
