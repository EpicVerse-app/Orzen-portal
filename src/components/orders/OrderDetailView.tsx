'use client'

import Link from 'next/link'
import {
  ChevronLeft, MapPin, Calendar, Package,
  Image as ImageIcon, Hash,
} from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import ImageCarousel from '@/components/ui/ImageCarousel'

interface OrderItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    unit: string
    image_url?: string | null
    image_url_2?: string | null
    image_url_3?: string | null
    category?: { name: string } | null
  }
}

export interface OrderDetail {
  id: string
  status: string
  created_at: string
  loaded_photo_url?: string | null
  shipped_photo_url?: string | null
  delivery_photo_url?: string | null
  branch?: {
    name: string
    city?: string
    state?: string
    address?: string
  } | null
  items: OrderItem[]
}

interface Props {
  order: OrderDetail
  backHref: string
  backLabel?: string
  /** Extra action buttons rendered at the bottom */
  actions?: React.ReactNode
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderDetailView({ order, backHref, backLabel = 'Back', actions }: Props) {
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      {/* Order header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-gray-300" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {shortId(order.id)}
              </h1>
            </div>
            <p className="text-[10px] text-gray-300 font-mono">{order.id}</p>
          </div>
          <OrderStatusBadge status={order.status as any} />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Branch */}
          {order.branch && (
            <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{order.branch.name}</p>
                {(order.branch.city || order.branch.state) && (
                  <p className="text-xs text-gray-400 truncate">
                    {[order.branch.city, order.branch.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {order.branch.address && (
                  <p className="text-xs text-gray-400 truncate">{order.branch.address}</p>
                )}
              </div>
            </div>
          )}

          {/* Date + summary */}
          <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-4 py-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-700">{fmtDate(order.created_at)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {order.items.length} product{order.items.length !== 1 ? 's' : ''} · {totalQty} items total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-3.5 border-b border-gray-50 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Products</h2>
          <span className="text-xs text-gray-400 ml-auto">{order.items.length} items</span>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="px-4 sm:px-6 py-3.5 flex items-center gap-3">
              <ImageCarousel
                images={[item.product.image_url, item.product.image_url_2, item.product.image_url_3]}
                alt={item.product.name}
                className="w-12 h-12 rounded-xl shrink-0"
                size={48}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400 truncate">{item.product.category?.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-800">× {item.quantity}</p>
                <p className="text-xs text-gray-400">{item.product.unit}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Totals footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-50 bg-gray-50/50 flex justify-between">
          <span className="text-xs text-gray-500 font-medium">Total quantity</span>
          <span className="text-xs font-bold text-gray-800">{totalQty} items</span>
        </div>
      </div>

      {/* Delivery photos */}
      {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Delivery Photos</h2>
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { url: order.loaded_photo_url,   label: 'Loaded'   },
              { url: order.shipped_photo_url,  label: 'Shipped'  },
              { url: order.delivery_photo_url, label: 'Received' },
            ].filter(p => p.url).map(({ url, label }) => (
              <div key={label} className="text-center">
                <a href={url!} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url!} alt={label}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                  />
                </a>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role-specific actions */}
      {actions && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4">
          {actions}
        </div>
      )}
    </div>
  )
}
