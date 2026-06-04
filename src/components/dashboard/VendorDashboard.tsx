'use client'

import { useState } from 'react'
import { Package, Clock, MapPin, Upload, CheckCircle, TrendingUp, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { sendOrderNotifications } from '@/app/actions/notifications'

interface Stats {
  total: number
  waitingApproval: number
  inProcess: number
  delivered: number
}

interface OrderItem {
  id: string
  quantity: number
  product: { id: string; name: string; image_url: string | null; unit: string }
}

interface Order {
  id: string
  status: string
  created_at: string
  branch: { id: string; name: string; address: string; city: string; state: string }
  items: OrderItem[]
}

interface Props {
  profile: { id: string; full_name: string; company_id: string; company: any }
  orders: Order[]
  stats: Stats
}

type ActiveStatus = 'approved' | 'packing' | 'loaded' | 'shipped'
const NEXT_STATUS: Partial<Record<string, string>> = {
  approved: 'packing',
  packing:  'loaded',
  loaded:   'shipped',
}
const STATUS_LABEL: Record<string, string> = {
  packing:   'being packed',
  loaded:    'loaded for dispatch',
  shipped:   'shipped',
  delivered: 'delivered',
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

const TITLE_MAP: Record<string, string> = {
  packing:   'Order Being Packed',
  loaded:    'Order Loaded',
  shipped:   'Order Shipped',
  delivered: 'Order Delivered',
}

export default function VendorDashboard({ profile, orders, stats }: Props) {
  const router = useRouter()
  const [processing, setProcessing]   = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const waitingOrders  = orders.filter(o => o.status === 'submitted')
  const activeOrders   = orders.filter(o => ['approved','packing','loaded','shipped'].includes(o.status))
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  async function updateStatus(order: Order) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setProcessing(order.id)
    const supabase = createClient()

    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id)
    if (error) {
      toast.error('Update failed.')
    } else {
      toast.success(`Marked as ${next}`)
      await sendOrderNotifications({
        orderId:     order.id,
        companyId:   profile.company_id,
        title:       TITLE_MAP[next] || `Order ${next}`,
        message:     `Order ${shortId(order.id)} is now ${STATUS_LABEL[next] || next}`,
        type:        `order_${next}`,
        targetRoles: ['super_manager', 'store_manager'],
        branchId:    order.branch.id,
      })
      router.refresh()
    }
    setProcessing(null)
  }

  async function uploadPhotoAndDeliver(order: Order, file: File) {
    setUploadingFor(order.id)
    const supabase = createClient()
    const path = `delivery/${order.id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage.from('order-photos').upload(path, file)
    if (uploadError) {
      toast.error('Photo upload failed.')
      setUploadingFor(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(path)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered', delivery_photo_url: publicUrl })
      .eq('id', order.id)

    if (!error) {
      await sendOrderNotifications({
        orderId:     order.id,
        companyId:   profile.company_id,
        title:       'Order Delivered',
        message:     `Order ${shortId(order.id)} has been delivered`,
        type:        'order_delivered',
        targetRoles: ['super_manager', 'store_manager'],
        branchId:    order.branch.id,
      })
      toast.success('Order marked as delivered!')
      router.refresh()
    } else {
      toast.error('Failed to mark as delivered.')
    }
    setUploadingFor(null)
  }

  const STAT_CARDS = [
    { label: 'Waiting Approval', value: stats.waitingApproval, color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock },
    { label: 'In Process',       value: stats.inProcess,       color: 'text-blue-600',   bg: 'bg-blue-50',   icon: TrendingUp },
    { label: 'Delivered',        value: stats.delivered,        color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
    { label: 'Total Orders',     value: stats.total,            color: 'text-gray-700',   bg: 'bg-gray-100',  icon: Package },
  ]

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's today's order overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active orders — actionable */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-700">
            In Process — Ready to Update ({activeOrders.length})
          </h2>
        </div>
        {activeOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No active orders to process</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">{shortId(order.id)}</p>
                  <OrderStatusBadge status={order.status as any} />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                  <span>{order.branch?.name} — {order.branch?.address}, {order.branch?.city}</span>
                </div>
                <div className="space-y-1.5">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden shrink-0">
                        {item.product?.image_url ? (
                          <Image src={item.product.image_url} alt={item.product.name} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-700 flex-1">{item.product?.name}</span>
                      <span className="text-xs font-semibold text-gray-800">×{item.quantity} {item.product?.unit}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {NEXT_STATUS[order.status] && order.status !== 'shipped' && (
                    <button
                      onClick={() => updateStatus(order)}
                      disabled={processing === order.id}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
                    >
                      {processing === order.id ? 'Updating…' : `Mark as ${NEXT_STATUS[order.status]}`}
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        {uploadingFor === order.id ? 'Uploading…' : 'Upload Delivery Photo'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadPhotoAndDeliver(order, file)
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

      {/* Waiting for approval */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-orange-700">
            Awaiting Approval ({waitingOrders.length})
          </h2>
        </div>
        {waitingOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No orders waiting for approval</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {waitingOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 space-y-2 opacity-70">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{shortId(order.id)}</p>
                  <OrderStatusBadge status={order.status as any} />
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{order.branch?.name} — {order.branch?.city}</span>
                </div>
                <div className="space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      {item.product?.name} × {item.quantity} {item.product?.unit}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 italic">Waiting for manager approval…</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivered */}
      {deliveredOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-green-700">
              Delivered ({deliveredOrders.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {deliveredOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-medium text-gray-700">{shortId(order.id)}</p>
                  <p className="text-xs text-gray-400">{order.branch?.name} — {order.branch?.city}</p>
                </div>
                <OrderStatusBadge status={order.status as any} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
