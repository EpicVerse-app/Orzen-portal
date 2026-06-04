import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

const FILTERS: Record<string, { label: string; statuses: string[] }> = {
  all:      { label: 'All Orders', statuses: ['submitted','approved','rejected','packing','loaded','shipped','delivered','closed'] },
  pending:  { label: 'Pending',    statuses: ['submitted'] },
  approved: { label: 'Approved',   statuses: ['approved','packing','loaded','shipped','delivered'] },
  rejected: { label: 'Rejected',   statuses: ['rejected'] },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default async function SuperOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const activeFilter = FILTERS[filter] ? filter : 'all'
  const { statuses } = FILTERS[activeFilter]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      branch:branches(id, name, city, state),
      items:order_items(id)
    `)
    .eq('company_id', profile.company_id)
    .in('status', statuses)
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/super"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Orders</h1>
      <p className="text-sm text-gray-400 mb-5">{allOrders.length} {FILTERS[activeFilter].label.toLowerCase()}</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Object.entries(FILTERS).map(([key, val]) => (
          <Link
            key={key}
            href={key === 'all' ? '/dashboard/super/orders' : `/dashboard/super/orders?filter=${key}`}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {val.label}
          </Link>
        ))}
      </div>

      {/* Orders list */}
      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {allOrders.map((order) => {
              const branch = order.branch as any
              const itemCount = (order.items as any)?.length || 0
              return (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* Branch */}
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {branch?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {branch?.city}, {branch?.state}
                      </p>
                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {shortId(order.id)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status as any} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
