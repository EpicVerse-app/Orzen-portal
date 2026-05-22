'use client'

import { useState } from 'react'
import { Package, Clock, MapPin, Upload, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppUser, Order, OrderStatus } from '@/types'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  profile: AppUser
  approvedOrders: Order[]
  holdOrders: Order[]
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  approved: 'packing',
  packing: 'loaded',
  loaded: 'shipped',
}

export default function VendorDashboard({ profile, approvedOrders, holdOrders }: Props) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  async function updateStatus(orderId: string, currentStatus: OrderStatus) {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    setProcessing(orderId)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: next })
      .eq('id', orderId)
    if (error) toast.error('Update failed.')
    else {
      toast.success(`Marked as ${next}`)
      router.refresh()
    }
    setProcessing(null)
  }

  async function uploadPhotoAndComplete(orderId: string, file: File) {
    setUploadingFor(orderId)
    const supabase = createClient()
    const path = `delivery/${orderId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('order-photos')
      .upload(path, file)

    if (uploadError) {
      toast.error('Photo upload failed.')
      setUploadingFor(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('order-photos')
      .getPublicUrl(path)

    await supabase.from('orders').update({ status: 'delivered', delivery_photo_url: publicUrl }).eq('id', orderId)
    toast.success('Order marked as delivered!')
    router.refresh()
    setUploadingFor(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{(profile.company as any)?.name}</p>
            <h1 className="text-lg font-semibold text-gray-900">{profile.full_name}</h1>
            <p className="text-xs text-gray-400">Vendor</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 text-sm font-semibold">
              {profile.full_name?.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Approved Orders — Actionable */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-green-700">
              Approved — Ready to Process ({approvedOrders.length})
            </h2>
          </div>
          {approvedOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No approved orders</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {approvedOrders.map((order) => (
                <div key={order.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                    <span>
                      {(order.branch as any)?.name} — {(order.branch as any)?.address}, {(order.branch as any)?.city}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(order.items as any)?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden shrink-0">
                          {item.product?.image_url ? (
                            <Image src={item.product.image_url} alt={item.product.name} width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-300 m-auto mt-2" />
                          )}
                        </div>
                        <span className="text-xs text-gray-700 flex-1">{item.product?.name}</span>
                        <span className="text-xs font-semibold text-gray-800">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {order.status !== 'shipped' && NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => updateStatus(order.id, order.status)}
                        disabled={processing === order.id}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        {processing === order.id ? 'Updating...' : `Mark as ${NEXT_STATUS[order.status]}`}
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          {uploadingFor === order.id ? 'Uploading...' : 'Upload Delivery Photo'}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadPhotoAndComplete(order.id, file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* On Hold Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-600">
              On Hold — Awaiting Approval ({holdOrders.length})
            </h2>
          </div>
          {holdOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No orders on hold</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {holdOrders.map((order) => (
                <div key={order.id} className="px-5 py-4 space-y-2 opacity-70">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{(order.branch as any)?.name} — {(order.branch as any)?.city}</span>
                  </div>
                  <div className="space-y-1">
                    {(order.items as any)?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        {item.product?.name} × {item.quantity}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 italic">Waiting for manager approval...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
