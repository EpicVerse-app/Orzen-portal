'use client'

import { AppUser, Order, CategoryWithCount } from '@/types'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { fadeUp, stagger, itemAnim } from '@/lib/motion'
import {
  Diamond, Monitor, Package, PenLine, BellRing,
  BookOpen, Tag, Layers, Archive, Gem, Headphones
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Props {
  profile: AppUser
  orders: Order[]
  categories: CategoryWithCount[]
  primaryColor: string
  sidebarColor: string
}

const CAT_ICONS = [Diamond, Package, Monitor, PenLine, BellRing, BookOpen, Layers, Archive, Gem, Tag]

export default function StoreManagerDashboard({ profile, orders, categories, primaryColor, sidebarColor }: Props) {
  const branch  = Array.isArray(profile.branch)  ? profile.branch[0]  : profile.branch  as any
  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  const gold = '#c9a84c'

  const openOrders = orders.filter(o => ['submitted', 'approved', 'packing', 'loaded'].includes(o.status))
  const inDelivery = orders.filter(o => o.status === 'shipped')
  const toReceive  = orders.filter(o => o.status === 'delivered')

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Live updates
  useRealtimeOrders(profile.company_id)

  return (
    <>
      {/* ── Page header + stats ─────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
            {company?.name} — {branch?.name}, {branch?.city} &nbsp;·&nbsp; {today}
          </p>
        </div>

        {/* Stats chips */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Open Orders', value: openOrders.length },
            { label: 'In Delivery',  value: inDelivery.length },
            { label: 'To Receive',   value: toReceive.length },
          ].map(({ label, value }) => (
            <motion.div key={label} variants={itemAnim}>
              <StatChip label={label} value={value} color={primaryColor} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Order Materials ─────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-4 mb-4">
            <p className="text-xs font-bold tracking-widest uppercase shrink-0" style={{ color: gold }}>
              Order Materials
            </p>
            <p className="text-sm text-gray-500 flex-1 hidden sm:block">
              Everything your store needs — pick a category to start an order.
            </p>
            <Link
              href="/dashboard/store/catalogue"
              className="text-sm font-semibold hover:opacity-80 transition-opacity shrink-0"
              style={{ color: primaryColor }}
            >
              Browse all →
            </Link>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            {categories.map((cat, idx) => {
              const Icon = CAT_ICONS[idx % CAT_ICONS.length]
              return (
                <motion.div key={cat.id} variants={itemAnim}>
                  <Link
                    href={`/dashboard/store/catalogue/${cat.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
                    style={{ borderLeft: `4px solid ${gold}` }}
                  >
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: gold }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed hidden sm:block">
                          {cat.description}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm font-semibold mt-1" style={{ color: gold }}>
                        {cat.product_count} items
                      </p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </section>
      )}

      {/* ── Bottom: My Orders + Delivery Status ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* My Orders — 2/3 */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
              My Orders
            </p>
            <Link
              href="/dashboard/store/orders"
              className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: primaryColor }}
            >
              View all →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No orders yet — tap <strong>+ New Order</strong> to get started
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
              {orders.slice(0, 6).map((order) => {
                const firstItem  = (order.items as any)?.[0]
                const extraCount = ((order.items as any)?.length || 1) - 1
                const itemLabel  = firstItem
                  ? `${firstItem.product?.name}${firstItem.quantity > 1 ? ` ×${firstItem.quantity}` : ''}${extraCount > 0 ? ` +${extraCount} more` : ''}`
                  : 'Order'

                return (
                  <motion.div
                    key={order.id}
                    variants={itemAnim}
                    className="px-4 sm:px-5 py-3 flex items-center gap-2 sm:gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-xs sm:text-sm font-bold text-gray-700 shrink-0">
                      #MO-{order.id.slice(-4).toUpperCase()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 flex-1 truncate min-w-0">
                      {itemLabel}
                    </p>
                    <div className="shrink-0">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Delivery Status */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1"
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
                Delivery Status
              </p>
            </div>

            {inDelivery.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No active deliveries
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
                {inDelivery.slice(0, 4).map((order, i) => {
                  const firstItem = (order.items as any)?.[0]
                  return (
                    <motion.div key={order.id} variants={itemAnim} className="px-5 py-3.5 flex items-start gap-3">
                      <motion.span
                        animate={{ scale: i === 0 ? [1, 1.3, 1] : 1 }}
                        transition={{ repeat: i === 0 ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }}
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: i === 0 ? '#f97316' : primaryColor }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          #MO-{order.id.slice(-4).toUpperCase()}&nbsp;
                          <span className="font-normal text-gray-500 text-xs">
                            {firstItem?.product?.name}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {i === 0 ? 'Out for delivery — today' : 'In transit'}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </motion.div>

          {/* Need a hand */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            whileHover={{ scale: 1.01 }}
            className="rounded-xl p-5 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Headphones className="w-5 h-5" style={{ color: gold }} />
              <p className="text-base font-bold">Need a hand?</p>
            </div>
            <p className="text-sm opacity-75 mb-4 leading-relaxed">
              Order help, returns or anything else — support is one tap away.
            </p>
            <a
              href="mailto:support@kriyora.com"
              className="inline-block text-sm font-bold px-5 py-2 rounded-lg transition-opacity hover:opacity-90 active:scale-95"
              style={{ backgroundColor: gold, color: '#000' }}
            >
              Get Support
            </a>
          </motion.div>

        </div>
      </div>
    </>
  )
}

/* ── Stat chip ─────────────────────────────────────────────── */
function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-4"
    >
      <p className="text-2xl sm:text-3xl font-bold leading-none" style={{ color }}>
        <AnimatedNumber value={value} />
      </p>
      <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight text-center sm:text-left">{label}</p>
    </motion.div>
  )
}
