'use client'

import { AppUser, Order, CategoryWithCount } from '@/types'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { useLiveOrders } from '@/hooks/useRealtimeOrders'
import { fadeUp, stagger, itemAnim } from '@/lib/motion'

const STORE_ORDER_SELECT = `id, status, created_at, items:order_items(id, quantity, product:products(id, name))` as const

async function fetchStoreOrder(id: string) {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  const { data } = await supabase.from('orders').select(STORE_ORDER_SELECT).eq('id', id).single()
  return (data as any) ?? null
}
import { Package, Headphones, ClipboardList, Truck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { m as motion } from 'framer-motion'
import AnimatedStatCard from '@/components/ui/AnimatedStatCard'

interface Props {
  profile: AppUser
  orders: Order[]
  categories: CategoryWithCount[]
  primaryColor: string
  sidebarColor: string
}


export default function StoreManagerDashboard({ profile, orders, categories, primaryColor, sidebarColor }: Props) {
  const branch  = Array.isArray(profile.branch)  ? profile.branch[0]  : profile.branch  as any
  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  const gold = '#c9a84c'

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Live order state — patched instantly without page refresh
  const liveOrders = useLiveOrders(orders as any[], profile.company_id, fetchStoreOrder)
  const openOrders = liveOrders.filter((o: any) => ['submitted', 'approved', 'packing', 'loaded'].includes(o.status))
  const inDelivery = liveOrders.filter((o: any) => o.status === 'shipped')
  const toReceive  = liveOrders.filter((o: any) => o.status === 'delivered')

  return (
    <>
      {/* ── Page header + stats ─────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6">
        <div className="mb-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{profile.full_name}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
            Store Manager{branch?.name ? ` · ${branch.name}` : ''}{branch?.city ? `, ${branch.city}` : ''} &nbsp;·&nbsp; {today}
          </p>
        </div>

        {/* Stats chips */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Open Orders', value: openOrders.length, href: '/dashboard/store/orders',           icon: ClipboardList, color: 'text-rose-700',    bg: 'bg-rose-50'    },
            { label: 'In Delivery', value: inDelivery.length, href: '/dashboard/store/deliveries',       icon: Truck,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
            { label: 'To Receive',  value: toReceive.length,  href: '/dashboard/store/delivery-history', icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, value, href, icon, color, bg }, i) => (
            <AnimatedStatCard key={label} label={label} value={value} icon={icon} color={color} bg={bg} href={href} index={i} />
          ))}
        </div>
      </motion.div>


      {/* ── Bottom: My Orders + Delivery Status ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* My Orders — 2/3 */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="md:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm"
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

          {liveOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No orders yet — tap <strong>+ New Order</strong> to get started
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="divide-y divide-gray-50">
              {liveOrders.slice(0, 6).map((order: any) => {
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

