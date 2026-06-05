'use client'

import { useState } from 'react'
import { Upload, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  companyId: string
  branchId: string
  shortId: string
}

export default function DeliveryReceiveButton({ orderId, companyId, branchId, shortId }: Props) {
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleReceived(file: File) {
    setUploading(true)
    const supabase = createClient()
    const path = `delivery/${orderId}/received_${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('order-photos')
      .upload(path, file)

    if (uploadError) {
      toast.error('Photo upload failed.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(path)

    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered', delivery_photo_url: publicUrl })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to confirm delivery.')
      setUploading(false)
      return
    }

    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Delivered',
      message:     `Order ${shortId} has been received and delivered`,
      type:        'order_delivered',
      targetRoles: ['super_manager', 'vendor'],
      branchId,
    })

    toast.success('Delivery confirmed!')
    router.refresh()
    setUploading(false)
  }

  return (
    <label className="flex-1 cursor-pointer">
      <div className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Received Photo
          </>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleReceived(file)
        }}
      />
    </label>
  )
}
