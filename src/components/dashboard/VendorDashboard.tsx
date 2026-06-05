'use client'

import { useState } from 'react'
import { Package, Clock, MapPin, Upload, CheckCircle, TrendingUp, Truck, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import ImageCarousel from '@/components/ui/ImageCarousel'
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
  product: {
    id: string
    name: string
    image_url: string | null
    image_url_2?: string | null
    image_url_3?: string | null
    unit: string
  }
}

interface Order {
  id: string
  status: string
  created_at: string
  loaded_photo_url?: string | null
  shipped_photo_url?: string | null
  delivery_photo_url?: string | null
  branch: { id: string; name: string; address: string; city: string; state: string }
  items: OrderItem[]
}

interface Props {
  profile: { id: string; full_name: string; company_id: string; company: any }
  orders: Order[]
  stats: Stats
}

// Vendor only moves: approved→packing (no photo), packing→loaded (photo), loaded→shipped (photo)
const NEXT_STATUS: Record<string, string> = {
  approved: 'packing',
  packing:  'loaded',
  loaded:   'shipped',
}

const PHOTO_REQUIRED: Record<string, boolean> = {
  packing:  false,
  loaded:   true,   // needs photo to become loaded
  shipped:  true,   // needs photo to become shipped
}

const PHOTO_LABEL: Record<string, string> = {
  loaded:  'Upload Loaded Photo',
  shipped: 'Upload Shipped Photo',
}

const STATUS_LABEL: Record<string, string> = {
  packing:   'being packed',
  loaded:    'loaded for dispatch',
  shipped:   'shipped / out for delivery',
  delivered: 'delivered',
}

const TITLE_MAP: Record<string, string> = {
  packing:   'Order Being Packed',
  loaded:    'Order Loaded',
  shipped:   'Order Shipped',
  delivered: 'Order Delivered',
}

const PHOTO_FIELD: Record<string, string> = {
  loaded:  'loaded_photo_url',
  shipped: 'shipped_photo_url',
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default function VendorDashboard({ profile, orders, stats }: Props) {
  const router = useRouter()
  const [processing, setProcessing]     = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const waitingOrders   = orders.filter(o => o.status === 'submitted')
  const activeOrders    = orders.filter(o => ['approved','packing','loaded','shipped'].includes(o.status))
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  // Mark as packing (no photo needed)
  async function markAsPacking(order: Order) {
    setProcessing(order.id)
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: 'packing' }).eq('id', order.id)
    if (error) {
      toast.error('Update failed.')
    } else {
      toast.success('Marked as packing')
      await sendOrderNotifications({
        orderId:     order.id,
        companyId:   profile.company_id,
        title:       'Order Being Packed',
        message:     `Order ${shortId(order.id)} is now being packed`,
        type:        'order_packing',
        targetRoles: ['super_manager', 'store_manager'],
        branchId:    order.branch.id,
      })
      router.refresh()
    }
    setProcessing(null)
  }

  // Upload photo + update status (for loaded and shipped)
  async function uploadPhotoAndUpdate(order: Order, file: File, newStatus: string) {
    setUploadingFor(`${order.id}_${newStatus}`)
    const supabase = createClient()
    const path = `delivery/${order.id}/${newStatus}_${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage.from('order-photos').upload(path, file)
    if (uploadError) {
      toast.error('Photo upload failed.')
      setUploadingFor(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('order-photos').getPublicUrl(path)
    const photoField = PHOTO_FIELD[newStatus]

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, [photoField]: publicUrl })
      .eq('id', order.id)

    if (error) {
      toast.error('Status update failed.')
      setUploadingFor(null)
      return
    }

    toast.success(`Marked as ${newStatus} with photo`)
    await sendOrderNotifications({
      orderId:     order.id,
      companyId:   profile.company_id,
      title:       TITLE_MAP[newStatus] || `Order ${newStatus}`,
      message:     `Order ${shortId(order.id)} is now ${STATUS_LABEL[newStatus] || newStatus}`,
      type:        `order_${newStatus}`,
      targetRoles: ['super_manager', 'store_manager'],
      branchId:    order.branch.id,
    })
    router.refresh()
    setUploadingFor(null)
  }

  const STAT_CARDS = [
    { label: 'Waiting Approval', value: stats.waitingApproval, color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock },
    { label: 'In Process',       value: stats.inProcess,       color: 'text-blue-600',   bg: 'bg-blue-50',   icon: TrendingUp },
    { label: 'Delivered',        value: stats.delivered,        color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle },
    { label: 'Total Orders',     value: stats.total,            color: 'text-gray-700',   bg: 'bg-gray-100',  icon: Package },
  ]

  function PhotoPreview({ url, label }: { url: string; label: string }) {
    return (
      <div className="mt-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={label} className="w-full max-w-[200px] h-24 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity" />
        </a>
      </div>
    )
  }

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

      {/* Active orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-700">
            In Process ({activeOrders.length})
          </h2>
        </div>
        {activeOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No active orders to process</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeOrders.map((order) => {
              const isUploading = (s: string) => uploadingFor === `${order.id}_${s}`

              return (
                <div key={order.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{shortId(order.id)}</p>
                    <OrderStatusBadge status={order.status as any} />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-400 shrink-0" />
                    <span>{order.branch?.name} — {order.branch?.address}, {order.branch?.city}</span>
                  </div>

                  {/* Products */}
                  <div className="space-y-1.5">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <ImageCarousel
                          images={[item.product?.image_url, item.product?.image_url_2, item.product?.image_url_3]}
                          alt={item.product?.name || ''}
                          className="w-12 h-12 rounded-lg shrink-0"
                          size={48}
                        />
                        <span className="text-xs text-gray-700 flex-1">{item.product?.name}</span>
                        <span className="text-xs font-semibold text-gray-800">×{item.quantity} {item.product?.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Uploaded photos */}
                  {order.loaded_photo_url && (
                    <PhotoPreview url={order.loaded_photo_url} label="Loaded Photo" />
                  )}
                  {order.shipped_photo_url && (
                    <PhotoPreview url={order.shipped_photo_url} label="Shipped Photo" />
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* Approved → Packing (no photo) */}
                    {order.status === 'approved' && (
                      <button
                        onClick={() => markAsPacking(order)}
                        disabled={processing === order.id}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        {processing === order.id ? 'Updating…' : 'Mark as Packing'}
                      </button>
                    )}

                    {/* Packing → Loaded (photo required) */}
                    {order.status === 'packing' && (
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                          {isUploading('loaded') ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>
                          ) : (
                            <><Upload className="w-4 h-4" />Upload Loaded Photo</>
                          )}
                        </div>
                        <input
                          type="file" accept="image/*" capture="environment" className="hidden"
                          disabled={!!uploadingFor}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadPhotoAndUpdate(order, file, 'loaded')
                          }}
                        />
                      </label>
                    )}

                    {/* Loaded → Shipped (photo required) */}
                    {order.status === 'loaded' && (
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                          {isUploading('shipped') ? (
                            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading…</>
                          ) : (
                            <><Upload className="w-4 h-4" />Upload Shipped Photo</>
                          )}
                        </div>
                        <input
                          type="file" accept="image/*" capture="environment" className="hidden"
                          disabled={!!uploadingFor}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadPhotoAndUpdate(order, file, 'shipped')
                          }}
                        />
                      </label>
                    )}

                    {/* Shipped → waiting for store manager to confirm */}
                    {order.status === 'shipped' && (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Waiting for delivery confirmation
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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
              <div key={order.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{shortId(order.id)}</p>
                  <OrderStatusBadge status={order.status as any} />
                </div>
                <p className="text-xs text-gray-400">{order.branch?.name} — {order.branch?.city}</p>
                {/* Show all photos */}
                <div className="flex gap-2 flex-wrap">
                  {order.loaded_photo_url && (
                    <a href={order.loaded_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.loaded_photo_url} alt="Loaded" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    </a>
                  )}
                  {order.shipped_photo_url && (
                    <a href={order.shipped_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.shipped_photo_url} alt="Shipped" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    </a>
                  )}
                  {order.delivery_photo_url && (
                    <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.delivery_photo_url} alt="Delivered" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
