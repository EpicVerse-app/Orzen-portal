'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Truck, CheckCircle2, X, Camera } from 'lucide-react'
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
  const [status, setStatus]           = useState(initialStatus)
  const [showModal, setShowModal]     = useState(false)
  const [details, setDetails]         = useState('')
  const [photoFile, setPhotoFile]     = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [pending, start]              = useTransition()

  function openModal() { setShowModal(true) }

  function closeModal() {
    setShowModal(false)
    setDetails('')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function confirmShipped() {
    start(async () => {
      const supabase = createClient()
      let shippingPhotoUrl: string | null = null

      if (photoFile) {
        const ext  = photoFile.name.split('.').pop() || 'jpg'
        const path = `shipping/${orderId}/shipped_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('order-photos')
          .upload(path, photoFile, { upsert: true })
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(path)
          shippingPhotoUrl = publicUrl
        }
      }

      const updateData: Record<string, unknown> = { status: 'shipped' }
      if (details.trim())   updateData.shipping_details   = details.trim()
      if (shippingPhotoUrl) updateData.shipping_photo_url = shippingPhotoUrl

      const { error } = await supabase
        .from('orders')
        .update(updateData)
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
      closeModal()
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

  return (
    <>
      <button
        onClick={openModal}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-blue-200 text-blue-700 text-sm font-semibold hover:border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Mark as Shipped
        </div>
      </button>

      {/* Shipping details modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-800">Shipping Details</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Shipping details <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 200))}
                  placeholder="Enter tracking ID, courier name, or shipping notes…"
                  rows={3}
                  className="w-full text-sm text-gray-800 placeholder:text-gray-400 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <p className="text-right text-[11px] text-gray-400 mt-0.5">{details.length}/200</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Photo <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      {photoPreview ? 'Change Photo' : 'Add Photo'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setPhotoFile(file)
                          setPhotoPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={closeModal}
                disabled={pending}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmShipped}
                disabled={pending || !details.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? 'Updating…' : 'Mark as Shipped'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
