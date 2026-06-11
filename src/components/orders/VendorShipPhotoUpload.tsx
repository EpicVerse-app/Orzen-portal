'use client'

import { useState } from 'react'
import { Camera, CheckCircle2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import toast from 'react-hot-toast'

interface Props {
  orderId:          string
  companyId:        string
  branchId:         string
  shortId:          string
  existingPhotoUrl?: string | null
}

export default function VendorShipPhotoUpload({ orderId, companyId, branchId, shortId, existingPhotoUrl }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState<string | null>(existingPhotoUrl || null)

  async function handleUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop() || 'jpg'
    const path = `delivery/${orderId}/shipped_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('order-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('Photo upload failed.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(path)

    // Save photo URL + mark order as delivered in one update
    const { error } = await supabase
      .from('orders')
      .update({ shipped_photo_url: publicUrl, status: 'delivered' })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to save photo.')
      setUploading(false)
      return
    }

    await sendOrderNotifications({
      orderId,
      companyId,
      title:       'Order Delivered',
      message:     `Order ${shortId} has been delivered`,
      type:        'order_delivered',
      targetRoles: ['store_head', 'store_manager'],
      branchId,
    })

    setPreview(publicUrl)
    toast.success('Delivery confirmed with photo!')
    setUploading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" />
        Upload Delivery Photo
        {preview && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-1" />}
      </p>
      <p className="text-[11px] text-gray-400">Uploading the photo will automatically mark this order as delivered.</p>

      <div className="flex items-center gap-3">
        {/* Preview */}
        {preview && (
          <a href={preview} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img
              src={preview}
              alt="Delivery"
              className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity"
            />
          </a>
        )}

        {/* Upload button */}
        <label className="cursor-pointer">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
            uploading
              ? 'bg-blue-400 text-white border-transparent cursor-not-allowed'
              : preview
                ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                : 'bg-blue-600 text-white hover:bg-blue-700 border-transparent'
          }`}>
            {uploading ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>
            ) : (
              <><Camera className="w-4 h-4" />{preview ? 'Replace Photo' : 'Upload Delivery Photo'}</>
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
              if (file) handleUpload(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}
