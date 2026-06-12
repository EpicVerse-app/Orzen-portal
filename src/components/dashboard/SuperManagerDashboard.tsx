'use client'

import Link from 'next/link'
import { m as motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  Package, TrendingUp, Building2, Activity, Eye,
} from 'lucide-react'
import { AppUser, Order } from '@/types'
import AnimatedStatCard from '@/components/ui/AnimatedStatCard'
import { useLiveOrders } from '@/hooks/useRealtimeOrders'
import { fadeUp, stagger, itemAnim, slideIn } from '@/lib/motion'
import { createClient } from '@/lib/supabase/client'

const SUPER_ORDER_SELECT = `
  id, status, created_at,
  branch:branches(id, name, city, state),
  items:order_items(id, quantity, product:products(id, name, unit, image_url))
` as const

async function fetchSuperOrder(id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('orders')
    .select(SUPER_ORDER_SELECT)
    .eq('id', id)
    .single()
  return (data as any) ?? null
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  branches: number
}

interface Props {
  profile: AppUser
  pendingOrders: Order[]
  recentActivity: Order[]
  stats: Stats
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now   = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (isToday)     return time
  if (isYesterday) return `Yesterday ${time}`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' + time
}
function activityLine(order: Order) {
  const branch = (order.branch as any)?.name || 'Branch'
  const id     = shortId(order.id)
  switch (order.status) {
    case 'submitted': return `Order ${id} submitted by ${branch}`
    case 'approved':  return `Order ${id} approved`
    case 'rejected':  return `Order ${id} rejected`
    case 'packing':   return `Order ${id} is being packed`
    case 'loaded':    return `Order ${id} loaded for delivery`
    case 'shipped':   return `Order ${id} shipped to ${branch}`
    case 'delivered': return `Order ${id} delivered to ${branch}`
    default:          return `Order ${id} updated`
  }
}
function activityDot(status: string) {
  switch (status) {
    case 'submitted': return 'bg-orange-400'
    case 'approved':  return 'bg-green-500'
    case 'rejected':  return 'bg-red-400'
    case 'packing':   return 'bg-blue-400'
    case 'loaded':
    case 'shipped':   return 'bg-indigo-400'
    case 'delivered': return 'bg-emerald-500'
    default:          return 'bg-gray-400'
  }
}

export default function SuperManagerDashboard({ profile, pendingOrders, recentActivity, stats }: Props) {
  // Live order state — all orders for this company, patched instantly on any change
  const allInitial  = [...pendingOrders, ...recentActivity.filter(o => !pendingOrders.find(p => p.id === o.id))]
  const liveOrders  = useLiveOrders(allInitial as any[], profile.company_id, fetchSuperOrder)

  const livePending  = liveOrders.filter((o: any) => o.status === 'submitted')
  const liveActivity = liveOrders.slice(0, 20)

  const liveStats = {
    ...stats,
    total:    liveOrders.length,
    pending:  livePending.length,
    approved: liveOrders.filter((o: any) => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length,
    rejected: liveOrders.filter((o: any) => o.status === 'rejected').length,
  }

  function getDaysAgo(date: string) {
    const diff  = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1)  return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const STAT_CARDS = [
    { href: '/dashboard/super/orders',                bg: 'bg-purple-50', border: 'border-gray-100',   hover: 'hover:border-purple-200', Icon: Package,   color: 'text-gray-800',    value: liveStats.total,    label: 'Total Orders' },
    { href: '/dashboard/super/orders?filter=pending', bg: 'bg-orange-50', border: 'border-orange-100', hover: 'hover:border-orange-300', Icon: Clock,     color: 'text-orange-500',  value: liveStats.pending,  label: 'Pending' },
    { href: '/dashboard/super/orders?filter=approved',bg: 'bg-green-50',  border: 'border-green-100',  hover: 'hover:border-green-300',  Icon: TrendingUp,color: 'text-green-600',   value: liveStats.approved, label: 'Approved' },
    { href: '/dashboard/super/orders?filter=rejected',bg: 'bg-red-50',    border: 'border-red-100',    hover: 'hover:border-red-300',    Icon: XCircle,   color: 'text-red-500',     value: liveStats.rejected, label: 'Rejected' },
    { href: '/dashboard/super/branches',              bg: 'bg-blue-50',   border: 'border-blue-100',   hover: 'hover:border-blue-300',   Icon: Building2, color: 'text-blue-600',    value: liveStats.branches, label: 'Branches', wide: true },
  ]

  return (
    <div className="px-4 sm:px-6 py-5 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Regional Manager{profile.scope_state ? ` · ${profile.scope_state}` : ''}{profile.scope_region ? ` · ${profile.scope_region} Region` : ''} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ href, bg, Icon, color, value, label, wide }, i) => (
          <div key={label} className={wide ? 'col-span-2 md:col-span-1' : ''}>
            <AnimatedStatCard label={label} value={value} icon={Icon} color={color} bg={bg} href={href} index={i} />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Pending Approvals */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700 flex-1">Pending Approvals</h2>
            <AnimatePresence>
              {livePending.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600"
                >
                  {livePending.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {livePending.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CheckCircle className="w-10 h-10 text-green-300 mb-3" />
              </motion.div>
              <p className="text-sm font-medium text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending approvals</p>
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50 overflow-y-auto max-h-[60vh] sm:max-h-[520px]">
              <AnimatePresence>
                {livePending.map((order) => {
                  const items = (order.items as any) || []
                  return (
                    <motion.div
                      key={order.id}
                      variants={slideIn}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      layout
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{(order.branch as any)?.name}</p>
                          <p className="text-xs text-gray-400">
                            {(order.branch as any)?.city}
                            {' · '}{items.length} {items.length === 1 ? 'item' : 'items'}
                            {' · '}{getDaysAgo(order.created_at)}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-0.5 font-mono">{shortId(order.id)}</p>
                        </div>
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                          <Clock className="w-4 h-4 text-orange-300 shrink-0 mt-0.5" />
                        </motion.div>
                      </div>

                      <div className="bg-gray-50 rounded-xl mb-3 divide-y divide-gray-100 overflow-hidden">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                            {item.product?.image_url ? (
                              <img src={item.product.image_url} alt={item.product?.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{item.product?.name || 'Unknown product'}</p>
                              <p className="text-[10px] text-gray-400">{item.product?.unit || '—'}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-700 shrink-0 bg-white px-2 py-1 rounded-lg border border-gray-200">
                              × {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={`/dashboard/super/orders/${order.id}`}
                        className="flex items-center justify-center gap-1.5 w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Order
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
          </div>

          {liveActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[50vh] sm:max-h-[420px]">
              <motion.div variants={stagger} initial="hidden" animate="show" className="px-5 py-3 space-y-0">
                {liveActivity.map((order, i) => (
                  <motion.div
                    key={order.id}
                    variants={itemAnim}
                    className="flex gap-3 py-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                        className={`w-2 h-2 rounded-full shrink-0 ${activityDot(order.status)}`}
                      />
                      {i < recentActivity.length - 1 && (
                        <span className="w-px flex-1 bg-gray-100 mt-1" />
                      )}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-xs text-gray-700 leading-snug">{activityLine(order)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(order.created_at)}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

