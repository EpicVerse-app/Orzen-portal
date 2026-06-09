import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, Calendar } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'submitted', label: 'Pending' },
  { key: 'approved',  label: 'Approved' },
  { key: 'shipped',   label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
]

export default async function StoreHeadOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, branch_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_head') redirect('/dashboard')

  let query = supabase
    .from('orders')
    .select('id, status, created_at, items:order_items(id, quantity)')
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: orders } = await query
  const allOrders = orders || []

  const activeTab = status || 'all'

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allOrders.length} order{allOrders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.key}
            href={tab.key === 'all' ? '/dashboard/store-head/orders' : `/dashboard/store-head/orders?status=${tab.key}`}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {allOrders.map((order: any) => {
            const qty = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
            return (
              <Link key={order.id} href={`/dashboard/store-head/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{shortId(order.id)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {fmtDate(order.created_at)} · {order.items?.length || 0} products · {qty} items
                  </p>
                </div>
                <OrderStatusBadge status={order.status as any} />
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
