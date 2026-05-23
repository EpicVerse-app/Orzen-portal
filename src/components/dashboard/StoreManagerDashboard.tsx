'use client'

import { AppUser, Order } from '@/types'
import AppShell from '@/components/layout/AppShell'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { ShoppingCart, Truck, CheckSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  profile: AppUser
  orders: Order[]
}

export default function StoreManagerDashboard({ profile, orders }: Props) {
  const router = useRouter()

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch

  const openOrders = orders.filter(o => ['submitted', 'approved', 'packing', 'loaded'].includes(o.status))
  const deliveriesDue = orders.filter(o => o.status === 'shipped')
  const toConfirm = orders.filter(o => o.status === 'delivered')

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <AppShell user={profile} onCreateOrder={() => router.push('/dashboard/store/catalogue')}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {branch?.name} &nbsp;·&nbsp; {branch?.city} &nbsp;·&nbsp; {today}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">Open Orders</p>
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 shrink-0" />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">{openOrders.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">in progress</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">Deliveries</p>
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 shrink-0" />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">{deliveriesDue.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">this week</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">To Confirm</p>
            <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 shrink-0" />
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">{toConfirm.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">awaiting you</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No orders yet — tap <strong>Create Order</strong> to place your first order
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 min-w-0">
                  <span className="text-sm font-semibold text-gray-600">
                    #OR-{order.id.slice(-4).toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 sm:text-gray-700 truncate">
                    {(order.items as any)?.length || 0} product{(order.items as any)?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </AppShell>
  )
}
