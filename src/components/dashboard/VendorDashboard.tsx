'use client'

import { Package, Clock, MapPin, CheckCircle, TrendingUp, Truck, Image as ImageIcon } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import ImageCarousel from '@/components/ui/ImageCarousel'

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
  delivery_photo_url?: string | null
  branch: { id: string; name: string; address: string; city: string; state: string }
  items: OrderItem[]
}

interface Props {
  profile: { id: string; full_name: string; company_id: string; company: any }
  orders: Order[]
  stats: Stats
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default function VendorDashboard({ profile, orders, stats }: Props) {
  const waitingOrders   = orders.filter(o => o.status === 'submitted')
  const activeOrders    = orders.filter(o => o.status === 'approved')
  const deliveredOrders = orders.filter(o => o.status === 'delivered')

  const STAT_CARDS = [
    { label: 'Waiting Approval', value: stats.waitingApproval, color: 'text-orange-500', bg: 'bg-orange-50',  Icon: Clock },
    { label: 'Approved',         value: stats.inProcess,       color: 'text-blue-600',   bg: 'bg-blue-50',    Icon: TrendingUp },
    { label: 'Delivered',        value: stats.delivered,       color: 'text-green-600',  bg: 'bg-green-50',   Icon: CheckCircle },
    { label: 'Total Orders',     value: stats.total,           color: 'text-gray-700',   bg: 'bg-gray-100',   Icon: Package },
  ]

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's your order overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, color, bg, Icon }) => (
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

      {/* Approved / In Process orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-blue-700">
            Approved Orders ({activeOrders.length})
          </h2>
        </div>
        {activeOrders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No approved orders at this time</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 space-y-3">
                {/* Order header */}
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
                        className="w-10 h-10 rounded-lg shrink-0"
                        size={40}
                      />
                      <span className="text-xs text-gray-700 flex-1">{item.product?.name}</span>
                      <span className="text-xs font-semibold text-gray-800">×{item.quantity} {item.product?.unit}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 italic">Waiting for store to confirm delivery</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting for Approval */}
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
              <div key={order.id} className="px-5 py-4 space-y-2 opacity-75">
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
                <div className="space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      {item.product?.name} × {item.quantity} {item.product?.unit}
                    </div>
                  ))}
                </div>
                {/* Delivery photo if available */}
                {order.delivery_photo_url && (
                  <div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
                      <ImageIcon className="w-3 h-3" /> Delivery Photo
                    </p>
                    <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.delivery_photo_url} alt="Delivery" className="w-20 h-20 rounded-xl object-cover border border-gray-200 hover:opacity-80" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
