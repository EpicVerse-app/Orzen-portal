'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Package, Clock, MapPin, CheckCircle, TrendingUp, Truck,
  Image as ImageIcon, ChevronDown, ChevronUp, Calendar,
  SlidersHorizontal, X, ChevronRight,
} from 'lucide-react'
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
    category?: { id: string; name: string } | null
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
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{shortId(order.id)}</p>
            <OrderStatusBadge status={order.status as any} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">{order.branch?.name} — {order.branch?.address}, {order.branch?.city}, {order.branch?.state}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatDate(order.created_at)}
            </div>
            <span className="text-[11px] text-gray-400">
              {order.items?.length} product{order.items?.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
              {order.items?.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
        </div>
        <div className="shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

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
                  {item.product?.category?.name && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.product.category.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-800">×{item.quantity}</p>
                  <p className="text-xs text-gray-400">{item.product?.unit}</p>
                </div>
              </div>
            ))}
          </div>

          {order.delivery_photo_url && (
            <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5">
                <ImageIcon className="w-3 h-3" /> Delivery Confirmation Photo
              </p>
              <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                <img src={order.delivery_photo_url} alt="Delivery"
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── New Orders section with category+product filter ─────
function NewOrdersSection({ orders }: { orders: Order[] }) {
  const [filterOpen, setFilterOpen]         = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [expandedCats, setExpandedCats]     = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

  // Build category → products map from all new orders
  const categoryMap = useMemo(() => {
    const map = new Map<string, { catId: string; catName: string; products: Map<string, string> }>()
    orders.forEach(o => o.items?.forEach(i => {
      const catId   = i.product?.category?.id   || 'uncategorised'
      const catName = i.product?.category?.name || 'Uncategorised'
      const prodId  = i.product?.id
      const prodName = i.product?.name
      if (!prodId) return
      if (!map.has(catId)) {
        map.set(catId, { catId, catName, products: new Map() })
        setExpandedCats(prev => new Set([...prev, catId]))   // expand by default
      }
      map.get(catId)!.products.set(prodId, prodName)
    }))
    return map
  }, [orders])

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    if (filterOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  function toggleProduct(id: string) {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCategory(catId: string) {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  function clearAll() {
    setSelectedProducts(new Set())
  }

  // Filter orders
  const filteredOrders = selectedProducts.size > 0
    ? orders.filter(o => o.items?.some(i => i.product?.id && selectedProducts.has(i.product.id)))
    : orders

  const activeCount = selectedProducts.size

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-3.5 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-700" />
          <h2 className="text-sm font-semibold text-orange-700">
            New Orders ({filteredOrders.length}{activeCount > 0 ? ` of ${orders.length}` : ''})
          </h2>
        </div>

        {/* Filter button — only show when there are orders */}
        <div className="relative" ref={panelRef} style={{ display: orders.length === 0 ? 'none' : 'block' }}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeCount > 0
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeCount > 0 && (
              <span className="bg-white text-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Filter dropdown panel */}
          {filterOpen && (
            <div className="absolute right-0 top-9 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Filter by Product</p>
                <div className="flex items-center gap-2">
                  {activeCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-orange-500 hover:underline font-medium">
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Category + product list */}
              <div className="max-h-72 overflow-y-auto">
                {categoryMap.size === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No products found</p>
                ) : (
                  Array.from(categoryMap.values()).map(({ catId, catName, products }) => (
                    <div key={catId}>
                      {/* Category row */}
                      <button
                        onClick={() => toggleCategory(catId)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{catName}</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedCats.has(catId) ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Products under category */}
                      {expandedCats.has(catId) && (
                        <div className="py-1">
                          {Array.from(products.entries()).map(([prodId, prodName]) => (
                            <label
                              key={prodId}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(prodId)}
                                onChange={() => toggleProduct(prodId)}
                                className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
                              />
                              <span className="text-sm text-gray-700">{prodName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {activeCount > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-orange-50">
                  <p className="text-xs text-orange-600 font-medium">
                    {activeCount} product{activeCount !== 1 ? 's' : ''} selected · showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && orders.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 flex-wrap">
          {Array.from(selectedProducts).map(prodId => {
            let name = prodId
            categoryMap.forEach(cat => { if (cat.products.has(prodId)) name = cat.products.get(prodId)! })
            return (
              <span key={prodId} className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {name}
                <button onClick={() => toggleProduct(prodId)} className="hover:text-orange-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No new orders</div>
      ) : filteredOrders.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No orders match the selected filter</p>
          <button onClick={clearAll} className="text-xs text-orange-500 mt-1 hover:underline">Clear filter</button>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}

// ── Generic section (no filter) ─────────────────────────
function OrderSection({ title, count, icon: Icon, iconColor, bgColor, emptyMsg, orders }: {
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
    { label: 'Waiting Delivery', value: stats.inProcess,       color: 'text-blue-600',   bg: 'bg-blue-50',    Icon: TrendingUp },
    { label: 'Delivered',        value: stats.delivered,       color: 'text-green-600',  bg: 'bg-green-50',   Icon: CheckCircle },
    { label: 'Total Orders',     value: stats.total,           color: 'text-gray-700',   bg: 'bg-gray-100',   Icon: Package },
  ]

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {profile.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's your order overview</p>
      </div>

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

      <NewOrdersSection orders={waitingOrders} />

      <OrderSection
        title="Waiting for Delivery" count={activeOrders.length}
        icon={Truck} iconColor="text-blue-700" bgColor="bg-blue-50 border-blue-100"
        emptyMsg="No orders waiting for delivery" orders={activeOrders}
      />

      <OrderSection
        title="Delivered" count={deliveredOrders.length}
        icon={CheckCircle} iconColor="text-green-700" bgColor="bg-green-50 border-green-100"
        emptyMsg="No delivered orders yet" orders={deliveredOrders}
      />
    </div>
  )
}
