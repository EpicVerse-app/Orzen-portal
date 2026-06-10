'use client'

import Link from 'next/link'
import {
  ChevronLeft, MapPin, Calendar, Package,
  Image as ImageIcon, Hash, AlertTriangle, Store,
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
  rejection_reason?: string | null
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
  /** Extra action buttons rendered in the left panel */
  actions?: React.ReactNode
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderDetailView({ order, backHref, backLabel = 'Back', actions }: Props) {
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="space-y-4">

      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-start">

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div className="lg:w-72 xl:w-80 shrink-0 space-y-3 lg:sticky lg:top-6">

          {/* Order ID + Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-300" />
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {shortId(order.id)}
                </h1>
              </div>
              <OrderStatusBadge status={order.status as any} />
            </div>
            <p className="text-[10px] text-gray-300 font-mono break-all">{order.id}</p>
          </div>

          {/* Store details */}
          {order.branch && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</p>
              </div>
              <p className="text-sm font-bold text-gray-800">{order.branch.name}</p>
              {(order.branch.city || order.branch.state) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {[order.branch.city, order.branch.state].filter(Boolean).join(', ')}
                </p>
              )}
              {order.branch.address && (
                <div className="flex items-start gap-1.5 mt-2">
                  <MapPin className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">{order.branch.address}</p>
                </div>
              )}
            </div>
          )}

          {/* Date / summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Date</p>
            </div>
            <p className="text-sm font-bold text-gray-800">{fmtDate(order.created_at)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtTime(order.created_at)}</p>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
              <span>{order.items.length} product{order.items.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold text-gray-600">{totalQty} items total</span>
            </div>
          </div>

          {/* Rejection reason */}
          {order.status === 'rejected' && order.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">Rejection Reason</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{order.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Delivery photos */}
          {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery Photos</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {[
                  { url: order.loaded_photo_url,   label: 'Loaded'   },
                  { url: order.shipped_photo_url,  label: 'Shipped'  },
                  { url: order.delivery_photo_url, label: 'Received' },
                ].filter(p => p.url).map(({ url, label }) => (
                  <div key={label} className="text-center">
                    <a href={url!} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url!} alt={label}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                      />
                    </a>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              {actions}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Products ──────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Products</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {order.items.map((item, idx) => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Index */}
                  <span className="text-xs font-semibold text-gray-300 w-5 shrink-0 text-center">
                    {idx + 1}
                  </span>

                  {/* Image */}
                  <ImageCarousel
                    images={[item.product.image_url, item.product.image_url_2, item.product.image_url_3]}
                    alt={item.product.name}
                    className="w-14 h-14 rounded-xl shrink-0"
                    size={56}
                  />

                  {/* Name + category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">
                      {item.product.name}
                    </p>
                    {item.product.category?.name && (
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {item.product.category.name}
                      </span>
                    )}
                  </div>

                  {/* Qty + unit */}
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-gray-800">× {item.quantity}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.product.unit}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/60 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Total quantity</span>
              <span className="text-sm font-bold text-gray-800">{totalQty} items</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
