'use client'

import { AppUser, Order, CategoryWithCount } from '@/types'
import AppShell from '@/components/layout/AppShell'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { ShoppingCart, Truck, CheckSquare, Grid3x3, Headphones } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  profile: AppUser
  orders: Order[]
  categories: CategoryWithCount[]
  primaryColor: string
  sidebarColor: string
}

export default function StoreManagerDashboard({ profile, orders, categories, primaryColor, sidebarColor }: Props) {
  const router = useRouter()
  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const primary = primaryColor
  const gold    = '#c9a84c'

  const openOrders  = orders.filter(o => ['submitted','approved','packing','loaded'].includes(o.status))
  const inDelivery  = orders.filter(o => o.status === 'shipped')
  const toReceive   = orders.filter(o => o.status === 'delivered')

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <AppShell user={profile} onCreateOrder={() => router.push('/dashboard/store/catalogue')} primaryColor={primaryColor} sidebarColor={sidebarColor}>

      {/* ── Page header + stats ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {(Array.isArray(profile.company) ? (profile.company as any)[0] : profile.company as any)?.name} — {(branch as any)?.name}, {(branch as any)?.city} &nbsp;·&nbsp; {today}
          </p>
        </div>

        {/* Stats chips */}
        <div className="flex gap-3 shrink-0">
          <StatChip label="Open Orders"  value={openOrders.length}  color={primary} />
          <StatChip label="In Delivery"  value={inDelivery.length}  color={primary} />
          <StatChip label="To Receive"   value={toReceive.length}   color={primary} />
        </div>
      </div>

      {/* ── Order Materials ─────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
                Order Materials
              </p>
              <p className="text-sm text-gray-500">
                Everything your store needs — pick a category to start an order.
              </p>
            </div>
            <Link
              href="/dashboard/store/catalogue"
              className="text-sm font-medium hover:opacity-80 transition-opacity shrink-0"
              style={{ color: gold }}
            >
              Browse all →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/dashboard/store/catalogue/${cat.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow group"
                style={{ borderTop: `3px solid ${gold}` }}
              >
                {/* Icon box */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primary }}
                >
                  <Grid3x3 className="w-5 h-5" style={{ color: gold }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>
                  )}
                  <p className="text-xs font-semibold mt-1" style={{ color: gold }}>
                    {cat.product_count} items
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Bottom: My Orders + Delivery Status ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* My Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
              My Orders
            </p>
            <Link
              href="/dashboard/store/orders"
              className="text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: gold }}
            >
              View all →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No orders yet — tap <strong>+ New Order</strong> to get started
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700">
                      #MO-{order.id.slice(-4).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {(order.items as any)?.[0]?.product?.name || 'Order'}
                      {(order.items as any)?.length > 1 ? ` +${(order.items as any).length - 1} more` : ''}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Status */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
                Delivery Status
              </p>
            </div>

            {inDelivery.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No active deliveries
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {inDelivery.slice(0, 4).map((order, i) => (
                  <div key={order.id} className="px-5 py-3 flex items-start gap-3">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: i === 0 ? '#f97316' : gold }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        #MO-{order.id.slice(-4).toUpperCase()} &nbsp;
                        <span className="font-normal text-gray-500 text-xs truncate">
                          {(order.items as any)?.[0]?.product?.name}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {i === 0 ? 'Out for delivery — today' : 'In transit'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Need a hand card */}
          <div
            className="rounded-xl p-4 text-white"
            style={{ backgroundColor: primary }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Headphones className="w-4 h-4" style={{ color: gold }} />
              <p className="text-sm font-bold">Need a hand?</p>
            </div>
            <p className="text-xs opacity-75 mb-3">
              Order help, returns or anything else — support is one tap away.
            </p>
            <a
              href="mailto:support@orzenflow.com"
              className="inline-block text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: gold, color: '#000' }}
            >
              Get Support
            </a>
          </div>
        </div>

      </div>
    </AppShell>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center min-w-[80px]">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
