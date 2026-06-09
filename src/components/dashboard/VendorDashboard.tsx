'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import {
  Package, CheckCircle, TrendingUp, Truck, Clock,
  Image as ImageIcon, ChevronDown, ChevronUp, Calendar,
  SlidersHorizontal, X, ChevronRight, MapPin, Download, Search,
} from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import ImageCarousel from '@/components/ui/ImageCarousel'
import AnimatedStatCard from '@/components/ui/AnimatedStatCard'
import { createClient } from '@/lib/supabase/client'
import { sendOrderNotifications } from '@/app/actions/notifications'
import { useLiveOrders } from '@/hooks/useRealtimeOrders'
import { fadeUp, stagger, itemAnim } from '@/lib/motion'
import VendorShipPhotoUpload from '@/components/orders/VendorShipPhotoUpload'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const ORDER_SELECT = `
  id, status, created_at, shipped_photo_url, delivery_photo_url,
  branch:branches(id, name, address, city, state),
  items:order_items(
    id, quantity,
    product:products(id, name, image_url, image_url_2, image_url_3, unit, category:categories(id, name))
  )
` as const

async function fetchVendorOrder(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', id)
    .single()
  return (data as any) ?? null
}

interface Stats {
  newOrders: number
  shipped: number
  delivered: number
  total: number
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
  shipped_photo_url?: string | null
  delivery_photo_url?: string | null
  branch: { id: string; name: string; address: string; city: string; state: string }
  items: OrderItem[]
}

interface Props {
  profile: { id: string; full_name: string; company_id: string; company: any }
  companyId: string
  newOrders: Order[]
  shippedOrders: Order[]
  deliveredOrders: Order[]
  stats: Stats
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Download order as text file ─────────────────────────
function downloadOrder(order: Order) {
  const lines = [
    `Order ID   : ${shortId(order.id)}`,
    `Date       : ${formatDate(order.created_at)}`,
    `Branch     : ${order.branch?.name}`,
    `Address    : ${order.branch?.address}, ${order.branch?.city}, ${order.branch?.state}`,
    `Status     : ${order.status}`,
    ``,
    `─────────────────────────────────────`,
    `PRODUCTS`,
    `─────────────────────────────────────`,
    ...(order.items?.map(i =>
      `${i.product?.name?.padEnd(30)} x${i.quantity} ${i.product?.unit}`
    ) || []),
    `─────────────────────────────────────`,
    `Total Items: ${order.items?.reduce((s, i) => s + i.quantity, 0)}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${shortId(order.id)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Single collapsible order card ──────────────────────
function OrderCard({
  order,
  companyId,
  showShipButton = false,
  showPhotoUpload = false,
}: {
  order: Order
  companyId: string
  showShipButton?: boolean
  showPhotoUpload?: boolean
}) {
  const [open, setOpen]         = useState(false)
  const [shipping, setShipping] = useState(false)
  const router     = useRouter()
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleHeaderClick(e: React.MouseEvent) {
    if (e.detail >= 2) {
      // Double-click → navigate to order detail
      if (clickTimer.current) clearTimeout(clickTimer.current)
      router.push(`/dashboard/vendor/orders/${order.id}`)
      return
    }
    // Single click → toggle accordion after short delay
    // (delay lets a follow-up double-click cancel it)
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      setOpen(o => !o)
    }, 250)
  }

  async function markShipped() {
    setShipping(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', order.id)

    if (error) {
      toast.error('Failed to update status.')
      setShipping(false)
      return
    }

    await sendOrderNotifications({
      orderId:     order.id,
      companyId,
      title:       'Order Shipped',
      message:     `Order ${shortId(order.id)} has been shipped`,
      type:        'order_shipped',
      targetRoles: ['store_head', 'store_manager'],
      branchId:    order.branch?.id,
    })

    toast.success('Order marked as shipped!')
    router.refresh()
    setShipping(false)
  }

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      whileHover={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <button
        onClick={handleHeaderClick}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{shortId(order.id)}</p>
            <OrderStatusBadge status={order.status as any} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">
              {order.branch?.name} — {order.branch?.address}, {order.branch?.city}, {order.branch?.state}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />
              {formatDate(order.created_at)}
            </div>
            <span className="text-[11px] text-gray-400">
              {order.items?.length} product{order.items?.length !== 1 ? 's' : ''}&nbsp;·&nbsp;
              {order.items?.reduce((s, i) => s + i.quantity, 0)} items
            </span>
            <span className="text-[10px] text-gray-300 hidden sm:inline">double-click to open</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-400"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-gray-100">
              {/* Products */}
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

              {/* Delivery photo */}
              {order.delivery_photo_url && (
                <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5">
                    <ImageIcon className="w-3 h-3" /> Delivery Photo
                  </p>
                  <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={order.delivery_photo_url} alt="Delivery"
                      className="w-24 h-24 rounded-xl object-cover border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              )}

              {/* Shipment photo upload (vendor — Waiting for Delivery) */}
              {showPhotoUpload && (
                <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
                  <VendorShipPhotoUpload
                    orderId={order.id}
                    companyId={companyId}
                    branchId={order.branch?.id}
                    shortId={shortId(order.id)}
                    existingPhotoUrl={order.shipped_photo_url}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="px-4 sm:px-5 py-3 border-t border-gray-50 flex gap-2">
                {showShipButton && (
                  <motion.button
                    onClick={markShipped}
                    disabled={shipping}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {shipping ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating…</>
                    ) : (
                      <><Truck className="w-4 h-4" />Mark as Shipped</>
                    )}
                  </motion.button>
                )}
                <motion.button
                  onClick={() => downloadOrder(order)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors ${showShipButton ? '' : 'flex-1'}`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── New Orders section with filter ─────────────────────
function NewOrdersSection({ orders, companyId }: { orders: Order[]; companyId: string }) {
  const [filterOpen, setFilterOpen]             = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [expandedCats, setExpandedCats]         = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

  const categoryMap = useMemo(() => {
    const map = new Map<string, { catId: string; catName: string; products: Map<string, string> }>()
    orders.forEach(o => o.items?.forEach(i => {
      const catId    = i.product?.category?.id   || 'uncategorised'
      const catName  = i.product?.category?.name || 'Uncategorised'
      const prodId   = i.product?.id
      const prodName = i.product?.name
      if (!prodId) return
      if (!map.has(catId)) {
        map.set(catId, { catId, catName, products: new Map() })
        setExpandedCats(prev => new Set([...prev, catId]))
      }
      map.get(catId)!.products.set(prodId, prodName)
    }))
    return map
  }, [orders])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  function toggleProduct(id: string) {
    setSelectedProducts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleCategory(catId: string) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })
  }
  function clearAll() { setSelectedProducts(new Set()) }

  const filteredOrders = selectedProducts.size > 0
    ? orders.filter(o => o.items?.some(i => i.product?.id && selectedProducts.has(i.product.id)))
    : orders
  const activeCount = selectedProducts.size

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-semibold text-blue-700">
            New Orders ({filteredOrders.length}{activeCount > 0 ? ` of ${orders.length}` : ''})
          </h2>
        </div>
        {orders.length > 0 && (
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setFilterOpen(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeCount > 0 ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeCount > 0 && (
                <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-9 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Filter by Product</p>
                    <div className="flex items-center gap-2">
                      {activeCount > 0 && <button onClick={clearAll} className="text-xs text-blue-500 hover:underline font-medium">Clear all</button>}
                      <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {categoryMap.size === 0 ? (
                      <p className="px-4 py-6 text-sm text-gray-400 text-center">No products found</p>
                    ) : Array.from(categoryMap.values()).map(({ catId, catName, products }) => (
                      <div key={catId}>
                        <button onClick={() => toggleCategory(catId)} className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{catName}</span>
                          <motion.div animate={{ rotate: expandedCats.has(catId) ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </motion.div>
                        </button>
                        <AnimatePresence initial={false}>
                          {expandedCats.has(catId) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="py-1">
                                {Array.from(products.entries()).map(([prodId, prodName]) => (
                                  <label key={prodId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={selectedProducts.has(prodId)} onChange={() => toggleProduct(prodId)} className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                                    <span className="text-sm text-gray-700">{prodName}</span>
                                  </label>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  {activeCount > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-100 bg-blue-50">
                      <p className="text-xs text-blue-600 font-medium">{activeCount} product{activeCount !== 1 ? 's' : ''} selected · {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {activeCount > 0 && orders.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 flex-wrap">
          {Array.from(selectedProducts).map(prodId => {
            let name = prodId
            categoryMap.forEach(cat => { if (cat.products.has(prodId)) name = cat.products.get(prodId)! })
            return (
              <span key={prodId} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {name}
                <button onClick={() => toggleProduct(prodId)}><X className="w-3 h-3" /></button>
              </span>
            )
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">No new orders</div>
      ) : filteredOrders.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No orders match the selected filter</p>
          <button onClick={clearAll} className="text-xs text-blue-500 mt-1 hover:underline">Clear filter</button>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="p-3 space-y-2"
        >
          {filteredOrders.map(order => (
            <motion.div key={order.id} variants={itemAnim}>
              <OrderCard order={order} companyId={companyId} showShipButton />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── Generic section ─────────────────────────────────────
function OrderSection({ title, icon: Icon, iconColor, bgColor, emptyMsg, orders, companyId, showPhotoUpload = false }: {
  title: string; icon: any; iconColor: string; bgColor: string; emptyMsg: string; orders: Order[]; companyId: string; showPhotoUpload?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 ${bgColor} border-b flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className={`text-sm font-semibold ${iconColor}`}>{title} ({orders.length})</h2>
      </div>
      {orders.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{emptyMsg}</div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="p-3 space-y-2"
        >
          {orders.map(order => (
            <motion.div key={order.id} variants={itemAnim}>
              <OrderCard order={order} companyId={companyId} showPhotoUpload={showPhotoUpload} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ── Main dashboard ──────────────────────────────────────
export default function VendorDashboard({ profile, companyId, newOrders, shippedOrders, deliveredOrders, stats }: Props) {
  const newOrdersRef  = useRef<HTMLDivElement>(null)
  const shippedRef    = useRef<HTMLDivElement>(null)
  const deliveredRef  = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Combine all orders into one live list, split by status in render
  const allInitial   = [...newOrders, ...shippedOrders, ...deliveredOrders]
  const liveOrders   = useLiveOrders(
    allInitial,
    companyId,
    fetchVendorOrder,
    ['approved', 'shipped', 'delivered'],
  )

  const liveNew       = liveOrders.filter(o => o.status === 'approved')
  const liveShipped   = liveOrders.filter(o => o.status === 'shipped')
  const liveDelivered = liveOrders.filter(o => o.status === 'delivered')

  const liveStats = {
    newOrders: liveNew.length,
    shipped:   liveShipped.length,
    delivered: liveDelivered.length,
    total:     liveOrders.length,
  }

  // Search filter across all orders
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return liveOrders.filter(o => {
      const sid = shortId(o.id).toLowerCase()
      const branchName = (o.branch as any)?.name?.toLowerCase() || ''
      return sid.includes(q) || o.id.toLowerCase().includes(q) || branchName.includes(q)
    })
  }, [searchQuery, liveOrders])

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const STAT_CARDS = [
    { label: 'New Orders',           value: liveStats.newOrders, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'hover:border-blue-300',   Icon: Package,    ref: newOrdersRef },
    { label: 'Waiting for Delivery', value: liveStats.shipped,   color: 'text-purple-600', bg: 'bg-purple-50', border: 'hover:border-purple-300', Icon: Truck,       ref: shippedRef },
    { label: 'Delivered',            value: liveStats.delivered, color: 'text-green-600',  bg: 'bg-green-50',  border: 'hover:border-green-300',  Icon: CheckCircle, ref: deliveredRef },
    { label: 'Total',                value: liveStats.total,     color: 'text-gray-700',   bg: 'bg-gray-100',  border: 'hover:border-gray-300',   Icon: TrendingUp,  ref: null },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="text-2xl font-bold text-gray-900">Hello, {profile.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's your order overview</p>
      </motion.div>

      {/* Search bar */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or branch name..."
            className="w-full pl-10 pr-9 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-400 mt-2 ml-1">
            {searchResults.length === 0 ? `No orders match "${searchQuery}"` : `${searchResults.length} order${searchResults.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, color, bg, Icon, ref }, i) => (
          <AnimatedStatCard
            key={label}
            label={label}
            value={value}
            icon={Icon}
            color={color}
            bg={bg}
            index={i}
            onClick={ref ? () => scrollTo(ref) : undefined}
          />
        ))}
      </div>

      {searchQuery ? (
        /* ── Search results ─────────────────────────────── */
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">
                Search Results {searchResults.length > 0 && `(${searchResults.length})`}
              </h2>
            </div>
            {searchResults.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No orders match "{searchQuery}"</p>
                <p className="text-xs text-gray-300 mt-1">Try searching by ORD-XXXXXX or branch name</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {searchResults.map(order => (
                  <OrderCard key={order.id} order={order as Order} companyId={companyId} showShipButton={order.status === 'approved'} showPhotoUpload={order.status === 'shipped'} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* ── Two-column split: New Orders | Waiting + Delivered ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* LEFT — New Orders */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" ref={newOrdersRef} className="scroll-mt-4">
            <NewOrdersSection orders={liveNew} companyId={companyId} />
          </motion.div>

          {/* RIGHT — Waiting for Delivery + Delivered stacked */}
          <div className="space-y-5">
            <motion.div variants={fadeUp} initial="hidden" animate="show" ref={shippedRef} className="scroll-mt-4"
              style={{ transitionDelay: '0.06s' }}>
              <OrderSection
                title="Waiting for Delivery" icon={Truck} iconColor="text-purple-700"
                bgColor="bg-purple-50 border-purple-100" emptyMsg="No orders waiting for delivery"
                orders={liveShipped} companyId={companyId} showPhotoUpload
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" ref={deliveredRef} className="scroll-mt-4"
              style={{ transitionDelay: '0.12s' }}>
              <OrderSection
                title="Delivered" icon={CheckCircle} iconColor="text-green-700"
                bgColor="bg-green-50 border-green-100" emptyMsg="No delivered orders yet"
                orders={liveDelivered} companyId={companyId}
              />
            </motion.div>
          </div>

        </div>
      )}
    </div>
  )
}
