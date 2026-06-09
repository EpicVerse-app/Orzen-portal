'use client'

import { useState } from 'react'
import Link from 'next/link'
import { m, AnimatePresence, LazyMotion, domAnimation, type Variants } from 'framer-motion'
import {
  ChevronLeft, Building2, MapPin, Users, Package,
  CheckCircle, Clock, AlertCircle, TrendingUp,
  Calendar, ShieldCheck, ChevronRight, ExternalLink,
} from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

const STATUS_ORDER = ['submitted', 'approved', 'packing', 'loaded', 'shipped', 'delivered', 'closed']

const STATUS_BAR_COLOR: Record<string, string> = {
  submitted: 'bg-gray-400',
  approved:  'bg-blue-500',
  packing:   'bg-yellow-400',
  loaded:    'bg-orange-400',
  shipped:   'bg-purple-500',
  delivered: 'bg-green-500',
  closed:    'bg-teal-500',
}

const REGION_COLOR: Record<string, { badge: string; ring: string }> = {
  North:   { badge: 'bg-blue-100 text-blue-700',   ring: 'ring-blue-200'   },
  South:   { badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-200' },
  Central: { badge: 'bg-amber-100 text-amber-700',  ring: 'ring-amber-200'  },
  East:    { badge: 'bg-green-100 text-green-700',  ring: 'ring-green-200'  },
  West:    { badge: 'bg-orange-100 text-orange-700', ring: 'ring-orange-200' },
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Animation variants ───────────────────────────────────
const fadeUp:   Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }
const stagger:  Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemAnim: Variants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }

// ── Types ────────────────────────────────────────────────
interface Staff  { id: string; full_name: string; role: string; created_at: string }
interface Order  { id: string; status: string; created_at: string; items: { id: string; quantity: number }[] }
interface Branch { id: string; name: string; address: string; city: string; state: string; region: string; created_at: string }

interface Props {
  branch: Branch
  allStaff: Staff[]
  allOrders: Order[]
}

export default function BranchDetailClient({ branch, allStaff, allOrders }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Stats
  const totalOrders     = allOrders.length
  const activeOrders    = allOrders.filter(o => !['delivered','closed'].includes(o.status)).length
  const deliveredOrders = allOrders.filter(o => ['delivered','closed'].includes(o.status)).length
  const pendingOrders   = allOrders.filter(o => o.status === 'submitted').length

  const statusCount = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = allOrders.filter(o => o.status === s).length
    return acc
  }, {})

  // Filter orders by stat card click
  const filteredOrders = activeFilter === 'active'
    ? allOrders.filter(o => !['delivered','closed'].includes(o.status))
    : activeFilter === 'delivered'
      ? allOrders.filter(o => ['delivered','closed'].includes(o.status))
      : activeFilter === 'pending'
        ? allOrders.filter(o => o.status === 'submitted')
        : allOrders

  const displayedOrders = filteredOrders.slice(0, 10)

  const regionStyle = REGION_COLOR[branch.region] || { badge: 'bg-gray-100 text-gray-600', ring: 'ring-gray-200' }

  const STAT_CARDS = [
    { key: null,        label: 'Total Orders',     value: totalOrders,     icon: Package,      color: 'text-blue-600',  bg: 'bg-blue-50',  activeBg: 'bg-blue-600'  },
    { key: 'active',    label: 'Active',           value: activeOrders,    icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50', activeBg: 'bg-amber-500' },
    { key: 'delivered', label: 'Delivered',        value: deliveredOrders, icon: CheckCircle,  color: 'text-green-600', bg: 'bg-green-50', activeBg: 'bg-green-600' },
    { key: 'pending',   label: 'Pending Approval', value: pendingOrders,   icon: AlertCircle,  color: 'text-red-500',   bg: 'bg-red-50',   activeBg: 'bg-red-500'   },
  ]

  return (
    <LazyMotion features={domAnimation}>
      <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto space-y-5">

        {/* Back link */}
        <m.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <Link
            href="/dashboard/super/branches"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Branches
          </Link>
        </m.div>

        {/* Header card */}
        <m.div variants={fadeUp} initial="hidden" animate="show">
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-5 ring-2 ${regionStyle.ring} ring-offset-0`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{branch.name}</h1>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{branch.address && `${branch.address}, `}{branch.city}, {branch.state}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {branch.region && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${regionStyle.badge}`}>
                    {branch.region}
                  </span>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  Since {fmtDate(branch.created_at)}
                </span>
              </div>
            </div>
          </div>
        </m.div>

        {/* Stat cards — clickable to filter orders */}
        <m.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ key, label, value, icon: Icon, color, bg, activeBg }) => {
            const isActive = activeFilter === key
            return (
              <m.button
                key={label}
                variants={itemAnim}
                onClick={() => setActiveFilter(isActive ? null : key)}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
                whileTap={{ scale: 0.96 }}
                className={`relative text-left rounded-2xl border px-4 py-4 transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? `${activeBg} border-transparent shadow-lg`
                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isActive ? 'bg-white/20' : bg}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : color}`} />
                </div>
                <AnimatedNumber
                  value={value}
                  className={`text-2xl font-bold ${isActive ? 'text-white' : color}`}
                />
                <p className={`text-[11px] mt-0.5 leading-tight ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{label}</p>
                {isActive && (
                  <m.div
                    layoutId="activeCard"
                    className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
                  />
                )}
              </m.button>
            )
          })}
        </m.div>
        {activeFilter && (
          <m.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-500 -mt-2 ml-1"
          >
            Showing <span className="font-semibold text-gray-700">{filteredOrders.length}</span> orders · <button onClick={() => setActiveFilter(null)} className="text-blue-500 hover:underline">Clear filter</button>
          </m.p>
        )}

        {/* Staff + breakdown row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Staff */}
          <m.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Staff ({allStaff.length})</h2>
            </div>
            {allStaff.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No staff assigned</p>
              </div>
            ) : (
              <m.div variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
                {allStaff.map((member) => (
                  <m.div
                    key={member.id}
                    variants={itemAnim}
                    whileHover={{ backgroundColor: '#f8fafc', x: 2 }}
                    className="px-5 py-3.5 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-sm font-bold text-white">
                        {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name || 'Unnamed'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-gray-400" />
                        <p className="text-[11px] text-gray-400 capitalize">{member.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </m.div>
                ))}
              </m.div>
            )}
          </m.div>

          {/* Status breakdown */}
          <m.div variants={fadeUp} initial="hidden" animate="show" className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Order Status Breakdown</h2>
            </div>
            {totalOrders === 0 ? (
              <div className="px-5 py-10 text-center">
                <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {STATUS_ORDER.filter(s => statusCount[s] > 0).map((status, i) => {
                  const pct = Math.round((statusCount[status] / totalOrders) * 100)
                  const barColor = STATUS_BAR_COLOR[status] || 'bg-gray-400'
                  return (
                    <m.div
                      key={status}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <OrderStatusBadge status={status as any} />
                        <span className="text-xs text-gray-500 tabular-nums">
                          {statusCount[status]} &nbsp;·&nbsp; {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <m.div
                          className={`h-full rounded-full ${barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </m.div>
                  )
                })}
              </div>
            )}
          </m.div>

        </div>

        {/* Orders list */}
        <m.div variants={fadeUp} initial="hidden" animate="show" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">
                {activeFilter ? 'Filtered Orders' : 'Recent Orders'}
              </h2>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {filteredOrders.length} total
            </span>
          </div>

          {displayedOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders in this category</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <m.div
                key={activeFilter ?? 'all'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="divide-y divide-gray-50"
              >
                {displayedOrders.map((order) => {
                  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) || 0
                  return (
                    <m.div
                      key={order.id}
                      whileHover={{ backgroundColor: '#f8fafc', x: 2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        href={`/dashboard/super/orders/${order.id}`}
                        className="flex items-center gap-3 sm:gap-4 px-5 py-3.5 group"
                      >
                        {/* Order ID + date */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                              {shortId(order.id)}
                            </p>
                            <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {fmtDate(order.created_at)}
                          </p>
                        </div>

                        {/* Items count */}
                        <div className="hidden sm:block text-right shrink-0">
                          <p className="text-xs text-gray-500">
                            {order.items?.length || 0} products
                          </p>
                          <p className="text-xs text-gray-400">{totalQty} items</p>
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          <OrderStatusBadge status={order.status as any} />
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </m.div>
                  )
                })}
              </m.div>
            </AnimatePresence>
          )}

          {filteredOrders.length > 10 && (
            <div className="px-5 py-3 border-t border-gray-50 text-center">
              <p className="text-xs text-gray-400">Showing 10 of {filteredOrders.length} orders</p>
            </div>
          )}
        </m.div>

      </div>
    </LazyMotion>
  )
}
