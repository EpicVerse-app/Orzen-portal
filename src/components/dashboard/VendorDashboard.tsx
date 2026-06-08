'use client'

import { useState } from 'react'
import { Package, Clock, MapPin, CheckCircle, TrendingUp, Truck, Image as ImageIcon, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Single collapsible order card ──────────────────────
function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          {/* Order ID + status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{shortId(order.id)}</p>
            <OrderStatusBadge status={order.status as any} />
          </div>

          {/* Branch details */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">{order.branch?.name} — {order.branch?.address}, {order.branch?.city}, {order.branch?.state}</span>
          </div>

          {/* Date + item count */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatDate(order.created_at)}
            </div>
            <span className="text-[11px] text-gray-400">
              {order.items?.length} product{order.items?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
              {order.items?.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className="shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable product list */}
      {open && (
        <div className="border-t border-gray-100">
          <div className="divide-y divide-gray-50">
            {order.items?.map((item) => (
              <div key={item.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <ImageCarousel
                  images={[item.product?.image_url, item.product?.image_url_2, item.product?.image_url_3]}
                  alt={item.product?.name || ''}
                  className="w-12 h-12 rounded-xl shrink-0"
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800">×{item.quantity}</p>
                  <p className="text-xs text-gray-400">{item.product?.unit}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery photo for delivered orders */}
          {order.delivery_photo_url && (
            <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5">
                <ImageIcon className="w-3 h-3" /> Delivery Confirmation Photo
              </p>
              <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.delivery_photo_url}
                  alt="Delivery"
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                />
              </a>
            </div>
          )}

          {/* Footer note */}
          <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-t border-gray-50">
            {order.status === 'submitted' && (
              <p className="text-xs text-orange-500 font-medium">⏳ Waiting for manager approval</p>
            )}
            {order.status === 'approved' && (
              <p className="text-xs text-blue-600 font-medium">📦 Approved — waiting for store to confirm delivery</p>
            )}
            {order.status === 'delivered' && (
              <p className="text-xs text-green-600 font-medium">✅ Delivered and confirmed</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ─────────────────────────────────────
function OrderSection({
  title, count, icon: Icon, iconColor, bgColor, emptyMsg, orders,
}: {
  title: string; count: number; icon: any; iconColor: string; bgColor: string; emptyMsg: string; orders: Order[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 ${bgColor} border-b flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className={`text-sm font-semibold ${iconColor}`}>{title} ({count})</h2>
      </div>
      {orders.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{emptyMsg}</div>
      ) : (
        <div className="p-3 space-y-2">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ──────────────────────────────────────
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

      {/* Approved orders */}
      <OrderSection
        title="Approved Orders"
        count={activeOrders.length}
        icon={Truck}
        iconColor="text-blue-700"
        bgColor="bg-blue-50 border-blue-100"
        emptyMsg="No approved orders at this time"
        orders={activeOrders}
      />

      {/* Waiting for approval */}
      <OrderSection
        title="Awaiting Approval"
        count={waitingOrders.length}
        icon={Clock}
        iconColor="text-orange-700"
        bgColor="bg-orange-50 border-orange-100"
        emptyMsg="No orders waiting for approval"
        orders={waitingOrders}
      />

      {/* Delivered */}
      <OrderSection
        title="Delivered"
        count={deliveredOrders.length}
        icon={CheckCircle}
        iconColor="text-green-700"
        bgColor="bg-green-50 border-green-100"
        emptyMsg="No delivered orders yet"
        orders={deliveredOrders}
      />
    </div>
  )
}
