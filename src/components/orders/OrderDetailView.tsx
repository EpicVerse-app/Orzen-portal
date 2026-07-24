'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronDown, MapPin, Calendar, Package,
  Image as ImageIcon, Hash, Store, Check, X, User,
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import ImageCarousel from '@/components/ui/ImageCarousel'
import GeneratePOButton from '@/components/orders/GeneratePOButton'

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
  base_order_number?: string | null
  rejection_reason?: string | null
  loaded_photo_url?: string | null
  shipped_photo_url?: string | null
  delivery_photo_url?: string | null
  ordered_by_name?: string | null
  ordered_by_id?: string | null
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
  companyName?: string
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

// ── Category accordion for detail page ───────────────────────────────────────
function catCode(name: string) {
  return name.toUpperCase().replace(/\s+/g, '_')
}

function CategoryPODownloads({ items, companyName, orderNumber, orderDate, branchName, branchAddress }: {
  items: OrderItem[]
  companyName: string
  orderNumber?: string | null
  orderDate: string
  branchName: string
  branchAddress: string
}) {
  const categoryMap = new Map<string, OrderItem[]>()
  for (const item of items) {
    const cat = item.product.category?.name ?? 'Uncategorized'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(item)
  }
  const categories = Array.from(categoryMap.entries())

  if (categories.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-4">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Download PO by Category</h2>
      </div>
      <div className="p-3 space-y-2">
        {categories.map(([cat, catItems]) => (
          <GeneratePOButton
            key={cat}
            orderNumber={orderNumber ? `${orderNumber}_${catCode(cat)}` : catCode(cat)}
            orderDate={orderDate}
            companyName={companyName}
            branchName={branchName}
            branchAddress={branchAddress}
            categoryLabel={cat}
            items={catItems.map(i => ({
              id: i.id,
              name: i.product.name,
              quantity: i.quantity,
              unit: i.product.unit,
              category: cat,
            }))}
          />
        ))}
      </div>
    </div>
  )
}

function ProductsByCategory({
  items, totalQty, hasPrices, totalPrice,
}: {
  items: OrderItem[]
  totalQty: number
  hasPrices: boolean
  totalPrice: number
}) {
  // Group items by category
  const categoryMap = new Map<string, OrderItem[]>()
  for (const item of items) {
    const cat = item.product.category?.name ?? 'Uncategorized'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(item)
  }
  const categories = Array.from(categoryMap.entries())

  // All open by default
  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(categories.map(([cat]) => cat))
  )

  function toggle(cat: string) {
    setOpenCats(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Package className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-800">Products</h2>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
          {items.length} product{items.length !== 1 ? 's' : ''} · {totalQty} items
        </span>
      </div>

      {/* Category sections */}
      <div className="divide-y divide-gray-100">
        {categories.map(([cat, catItems]) => {
          const isOpen   = openCats.has(cat)
          const catQty   = catItems.reduce((s, i) => s + i.quantity, 0)
          const catPrice = hasPrices ? catItems.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0) : 0

          return (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => toggle(cat)}
                className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat}</span>
                  <span className="text-[11px] text-gray-400">
                    {catItems.length} product{catItems.length !== 1 ? 's' : ''} · {catQty} items
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {hasPrices && catPrice > 0 && (
                    <span className="text-xs font-semibold text-gray-700">₹{catPrice.toLocaleString('en-IN')}</span>
                  )}
                  <m.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </m.div>
                </div>
              </button>

              {/* Items */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    key={`items-${cat}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-gray-50/50 divide-y divide-gray-100 border-t border-gray-100">
                      {catItems.map((item, idx) => (
                        <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                          <span className="text-xs font-semibold text-gray-200 w-5 shrink-0 text-center select-none">
                            {idx + 1}
                          </span>
                          <ImageCarousel
                            images={[item.product.image_url, item.product.image_url_2, item.product.image_url_3]}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-xl shrink-0"
                            size={48}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">{item.product.name}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-gray-900">×{item.quantity}</p>
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
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
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
  )
}

// ── Component ────────────────────────────────────────────────────────────────
export default function OrderDetailView({ order, backHref, backLabel = 'Back', actions, companyName }: Props) {
  const totalQty    = order.items.reduce((s, i) => s + i.quantity, 0)
  const hasPrices   = order.items.some(i => (i.product.price ?? 0) > 0)
  const totalPrice  = order.items.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0)
  const isRejected  = order.status === 'rejected'
  const branch      = order.branch
  const branchName  = branch?.name ?? ''
  const branchAddress = [branch?.address, branch?.city, branch?.state].filter(Boolean).join(', ')

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
                <h1 className="text-lg font-bold text-gray-900 tracking-tight font-mono">
                  {order.base_order_number ?? shortId(order.id)}
                </h1>
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

          {/* Ordered By */}
          {(order.ordered_by_name || order.ordered_by_id) && (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Ordered By</p>
              </div>
              {order.ordered_by_name && (
                <p className="text-sm font-bold text-gray-900">{order.ordered_by_name}</p>
              )}
              {order.ordered_by_id && (
                <p className="text-xs text-gray-400 mt-0.5">ID: {order.ordered_by_id}</p>
              )}
            </div>
          )}

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

        {/* ── RIGHT PANEL — Products by Category ─────────────── */}
        <div className="flex-1 min-w-0">
          <ProductsByCategory
            items={order.items}
            totalQty={totalQty}
            hasPrices={hasPrices}
            totalPrice={totalPrice}
          />
          {companyName && (
            <CategoryPODownloads
              items={order.items}
              companyName={companyName}
              orderNumber={order.base_order_number}
              orderDate={order.created_at}
              branchName={branchName}
              branchAddress={branchAddress}
            />
          )}
        </div>

      </div>
    </div>
  )
}
