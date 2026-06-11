'use client'

import Link from 'next/link'
import {
  ChevronLeft, MapPin, Calendar, Package,
  Image as ImageIcon, Hash, AlertTriangle, Store,
  Check, X,
} from 'lucide-react'
import ImageCarousel from '@/components/ui/ImageCarousel'

interface OrderItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    unit: string
    price?: number | null
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
  actions?: React.ReactNode
}

// ── Status timeline config ───────────────────────────────────────────────────
const STEPS = [
  { key: 'submitted', label: 'Submitted',  sub: 'Order placed by store' },
  { key: 'approved',  label: 'Approved',   sub: 'Approved by store head' },
  { key: 'shipped',   label: 'Shipped',    sub: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered',  sub: 'Received at store' },
]

const STATUS_RANK: Record<string, number> = {
  submitted: 0,
  approved:  1,
  packing:   2,  // legacy — maps to shipped step being active
  loaded:    2,  // legacy — same
  shipped:   2,
  delivered: 4,  // intentionally > last step index (3) so delivered step shows as done
  closed:    4,
  rejected:  -1,
}

type StepState = 'done' | 'active' | 'pending'

function getStepState(stepKey: string, orderStatus: string): StepState {
  if (orderStatus === 'rejected') {
    return stepKey === 'submitted' ? 'done' : 'pending'
  }
  const rank = STATUS_RANK[orderStatus] ?? 0
  const idx  = STEPS.findIndex(s => s.key === stepKey)
  if (idx < rank)  return 'done'
  if (idx === rank) return 'active'
  return 'pending'
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// ── Component ────────────────────────────────────────────────────────────────
export default function OrderDetailView({ order, backHref, backLabel = 'Back', actions }: Props) {
  const totalQty    = order.items.reduce((s, i) => s + i.quantity, 0)
  const hasPrices   = order.items.some(i => (i.product.price ?? 0) > 0)
  const totalPrice  = order.items.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0)
  const isRejected  = order.status === 'rejected'

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

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="lg:w-96 xl:w-[420px] shrink-0 space-y-3 lg:sticky lg:top-6">

          {/* Order ID + status */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-300" />
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">{shortId(order.id)}</h1>
              </div>
              {/* B&W status badge */}
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isRejected
                  ? 'bg-gray-900 text-white border-gray-900'
                  : order.status === 'delivered' || order.status === 'closed'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-900 border-gray-900'
              } capitalize`}>
                {order.status === 'closed' ? 'Delivered' : order.status}
              </span>
            </div>
            <p className="text-[10px] text-gray-300 font-mono break-all">{order.id}</p>
          </div>

          {/* ── Status timeline ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-5">
              Order Progress
            </p>

            {isRejected ? (
              /* Rejected path */
              <div className="flex flex-col gap-0">
                {/* Submitted — done */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="w-px flex-1 min-h-[28px] bg-gray-200 my-1" />
                  </div>
                  <div className="pb-5 pt-0.5">
                    <p className="text-sm font-semibold text-gray-900">Submitted</p>
                    <p className="text-xs text-gray-400 mt-0.5">Order placed by store</p>
                  </div>
                </div>
                {/* Rejected — terminal */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <X className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-gray-900">Rejected</p>
                    {order.rejection_reason && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {order.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Normal flow */
              <div className="flex flex-col gap-0">
                {STEPS.map((step, idx) => {
                  const state   = getStepState(step.key, order.status)
                  const isLast  = idx === STEPS.length - 1

                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      {/* Circle + connector */}
                      <div className="flex flex-col items-center">
                        {/* Circle */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          state === 'done'
                            ? 'bg-gray-900 border-gray-900'
                            : state === 'active'
                            ? 'bg-white border-gray-900'
                            : 'bg-white border-gray-200'
                        }`}>
                          {state === 'done'
                            ? <Check className="w-3.5 h-3.5 text-white" />
                            : state === 'active'
                            ? <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                            : <div className="w-2 h-2 rounded-full bg-gray-200" />
                          }
                        </div>
                        {/* Connector line */}
                        {!isLast && (
                          <div className={`w-px flex-1 min-h-[28px] my-1 ${
                            state === 'done' ? 'bg-gray-900' : 'bg-gray-100'
                          }`} />
                        )}
                      </div>

                      {/* Label */}
                      <div className={`pb-5 pt-0.5 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-semibold ${
                          state === 'pending' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {step.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          state === 'pending' ? 'text-gray-200' : 'text-gray-400'
                        }`}>
                          {step.sub}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Store */}
          {order.branch && (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Store</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{order.branch.name}</p>
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

          {/* Date */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Order Date</p>
            </div>
            <p className="text-sm font-bold text-gray-900">{fmtDate(order.created_at)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmtTime(order.created_at)}</p>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>{order.items.length} product{order.items.length !== 1 ? 's' : ''}</span>
              <div className="text-right">
                <p className="font-semibold text-gray-700">{totalQty} items total</p>
                {hasPrices && (
                  <p className="font-semibold text-gray-900 mt-0.5">₹{totalPrice.toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery photos */}
          {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Delivery Photos</p>
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
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              {actions}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Products ──────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Products</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {order.items.map((item, idx) => (
                <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Index */}
                  <span className="text-xs font-semibold text-gray-200 w-5 shrink-0 text-center select-none">
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
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {item.product.name}
                    </p>
                    {item.product.category?.name && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">
                        {item.product.category.name}
                      </span>
                    )}
                  </div>

                  {/* Qty + unit + price */}
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-gray-900">× {item.quantity}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{item.product.unit}</p>
                    {(item.product.price ?? 0) > 0 && (
                      <>
                        <p className="text-xs text-gray-400 mt-1">₹{item.product.price!.toLocaleString('en-IN')} / {item.product.unit}</p>
                        <p className="text-xs font-semibold text-gray-700 mt-0.5">₹{(item.product.price! * item.quantity).toLocaleString('en-IN')}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Total quantity</span>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{totalQty} items</span>
                {hasPrices && (
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">₹{totalPrice.toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
