import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ChevronLeft, Building2, MapPin, Users, Package,
  CheckCircle, Clock, Truck, AlertCircle, TrendingUp,
  Calendar, User, ShieldCheck,
} from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_ORDER = ['submitted', 'approved', 'packing', 'loaded', 'shipped', 'delivered', 'closed']

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  // Fetch branch
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, address, city, state, region, created_at')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!branch) notFound()

  // Fetch staff at this branch
  const { data: staff } = await supabase
    .from('users')
    .select('id, full_name, role, created_at')
    .eq('branch_id', id)
    .order('role')

  // Fetch all orders for this branch
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      items:order_items(id, quantity)
    `)
    .eq('branch_id', id)
    .order('created_at', { ascending: false })

  const allOrders   = orders || []
  const allStaff    = staff  || []

  // Stats
  const totalOrders     = allOrders.length
  const activeOrders    = allOrders.filter(o => !['delivered','closed'].includes(o.status)).length
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered' || o.status === 'closed').length
  const pendingOrders   = allOrders.filter(o => o.status === 'submitted').length

  // Status breakdown
  const statusCount = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = allOrders.filter(o => o.status === s).length
    return acc
  }, {})

  const recentOrders = allOrders.slice(0, 8)

  const STAT_CARDS = [
    { label: 'Total Orders',    value: totalOrders,     icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Active',          value: activeOrders,    icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Delivered',       value: deliveredOrders, icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Pending Approval',value: pendingOrders,   icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-50'    },
  ]

  const REGION_COLOR: Record<string, string> = {
    North:   'bg-blue-50 text-blue-600',
    South:   'bg-purple-50 text-purple-600',
    Central: 'bg-amber-50 text-amber-600',
    East:    'bg-green-50 text-green-600',
    West:    'bg-orange-50 text-orange-600',
  }
  const regionClass = REGION_COLOR[branch.region] || 'bg-gray-100 text-gray-600'

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto space-y-6">

      {/* Back */}
      <Link
        href="/dashboard/super/branches"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Branches
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{branch.name}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{branch.address && `${branch.address}, `}{branch.city}, {branch.state}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {branch.region && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${regionClass}`}>
                {branch.region}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Since {fmtDate(branch.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Staff card */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Staff ({allStaff.length})</h2>
          </div>
          {allStaff.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No staff assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allStaff.map((member) => (
                <div key={member.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-600">
                      {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name || 'Unnamed'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-gray-400" />
                      <p className="text-[11px] text-gray-400 capitalize">{member.role?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
            <div className="p-5 space-y-3">
              {STATUS_ORDER.filter(s => statusCount[s] > 0).map(status => {
                const pct = Math.round((statusCount[s] / totalOrders) * 100)
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={status as any} />
                      </div>
                      <span className="text-xs text-gray-500">{statusCount[status]} orders ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
          </div>
          <span className="text-xs text-gray-400">{totalOrders} total</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No orders placed yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const totalQty = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/super/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{shortId(order.id)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{fmtDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{order.items?.length || 0} products · {totalQty} items</p>
                  </div>
                  <OrderStatusBadge status={order.status as any} />
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
