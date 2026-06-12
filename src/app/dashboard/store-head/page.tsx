import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, AlertCircle } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import StoreHeadDashboardStats from '@/components/store-head/StoreHeadDashboardStats'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function StoreHeadDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, company_id, branch_id, branch:branches(id, name, city, state, region)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_head') redirect('/dashboard')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, created_at, items:order_items(id, quantity)')
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })

  const allOrders    = orders || []
  const pending      = allOrders.filter(o => o.status === 'submitted')
  const active       = allOrders.filter(o => !['submitted','delivered','closed','rejected'].includes(o.status))
  const delivered    = allOrders.filter(o => ['delivered','closed'].includes(o.status))
  const inTransit    = allOrders.filter(o => o.status === 'shipped')
  const recent       = allOrders.slice(0, 6)


  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Store Head{branch?.name ? ` · ${branch.name}` : ''}{branch?.city ? `, ${branch.city}` : ''} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <StoreHeadDashboardStats
        pendingCount={pending.length}
        activeCount={active.length}
        inTransitCount={inTransit.length}
        deliveredCount={delivered.length}
      />

      {/* Pending approvals — action required */}
      {pending.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h2 className="text-sm font-bold text-orange-800">{pending.length} order{pending.length !== 1 ? 's' : ''} waiting for your approval</h2>
            </div>
            <Link href="/dashboard/store-head/requests" className="flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900">
              Review all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
          </div>
          <Link href="/dashboard/store-head/orders" className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No orders yet for this store</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((order: any) => {
              const qty = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
              return (
                <Link key={order.id} href={`/dashboard/store-head/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{shortId(order.id)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(order.created_at)} · {order.items?.length || 0} products · {qty} items</p>
                  </div>
                  <OrderStatusBadge status={order.status as any} />
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
