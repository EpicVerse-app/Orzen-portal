import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Store, MapPin, ChevronRight, ArrowLeft, Users, ShoppingBag,
  Clock, CheckCircle, Truck, XCircle, Package, Phone, Mail, User,
  Calendar, TrendingUp
} from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) { return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase() }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  submitted: { label: 'Pending',    icon: Clock,        color: 'text-yellow-600', dot: 'bg-yellow-400' },
  approved:  { label: 'Approved',   icon: CheckCircle,  color: 'text-blue-600',   dot: 'bg-blue-400'   },
  shipped:   { label: 'In Transit', icon: Truck,        color: 'text-purple-600', dot: 'bg-purple-400' },
  delivered: { label: 'Delivered',  icon: CheckCircle,  color: 'text-green-600',  dot: 'bg-green-400'  },
  rejected:  { label: 'Rejected',   icon: XCircle,      color: 'text-red-500',    dot: 'bg-red-400'    },
}

const ROLE_LABEL: Record<string, string> = {
  store_manager: 'Store Manager', store_head: 'Store Head',
  super_manager: 'Regional Manager', vendor: 'Vendor', admin: 'Admin',
}
const ROLE_COLOR: Record<string, string> = {
  store_manager: 'bg-green-100 text-green-700',
  store_head:    'bg-violet-100 text-violet-700',
  super_manager: 'bg-blue-100 text-blue-700',
  vendor:        'bg-orange-100 text-orange-700',
  admin:         'bg-red-100 text-red-700',
}

export default async function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch branch
  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!branch) notFound()

  // Fetch users for this branch
  const { data: branchUsers } = await supabase
    .from('users')
    .select('id,full_name,email,role,username,phone')
    .eq('branch_id', id)
    .order('role')

  // Fetch orders for this branch
  const { data: orders } = await supabase
    .from('orders')
    .select('id,status,created_at,items:order_items(id)')
    .eq('branch_id', id)
    .order('created_at', { ascending: false })

  const allOrders = orders || []
  const recentOrders = allOrders.slice(0, 10)

  // Order stats
  const byStatus: Record<string, number> = {}
  allOrders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })

  const manager   = (branchUsers || []).find(u => u.role === 'store_manager')
  const storeHead = (branchUsers || []).find(u => u.role === 'store_head')

  // Month trend (last 6 months)
  const monthMap: Record<string, number> = {}
  allOrders.forEach(o => {
    const m = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    monthMap[m] = (monthMap[m] || 0) + 1
  })
  const months = Object.entries(monthMap).slice(-6)
  const maxCount = Math.max(...months.map(([, c]) => c), 1)

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/dashboard/admin/branches" className="hover:text-gray-700 transition-colors">All States</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        {branch.state && (
          <>
            <Link href={`/dashboard/admin/branches?state=${encodeURIComponent(branch.state)}`}
              className="hover:text-gray-700 transition-colors">{branch.state}</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </>
        )}
        {branch.region && (
          <>
            <Link href={`/dashboard/admin/branches?state=${encodeURIComponent(branch.state)}&region=${encodeURIComponent(branch.region)}`}
              className="hover:text-gray-700 transition-colors capitalize">{branch.region} Region</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </>
        )}
        <span className="text-gray-700 font-semibold">{branch.name}</span>
      </div>

      {/* Title bar */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: '#570439' }}>
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{branch.name}</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{branch.city}</span>
              {branch.state && <><span>·</span><span>{branch.state}</span></>}
              {branch.region && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 capitalize">{branch.region}</span>
              )}
            </div>
            {branch.address && <p className="text-xs text-gray-400 mt-0.5">{branch.address}</p>}
          </div>
        </div>
        <Link href={branch.region
          ? `/dashboard/admin/branches?state=${encodeURIComponent(branch.state)}&region=${encodeURIComponent(branch.region)}`
          : branch.state
          ? `/dashboard/admin/branches?state=${encodeURIComponent(branch.state)}`
          : '/dashboard/admin/branches'}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Orders',  value: allOrders.length,           color: 'text-gray-800',    icon: ShoppingBag },
          { label: 'Pending',       value: byStatus['submitted'] || 0, color: 'text-yellow-600',  icon: Clock       },
          { label: 'Approved',      value: byStatus['approved']  || 0, color: 'text-blue-600',    icon: CheckCircle },
          { label: 'In Transit',    value: byStatus['shipped']   || 0, color: 'text-purple-600',  icon: Truck       },
          { label: 'Delivered',     value: byStatus['delivered'] || 0, color: 'text-green-600',   icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Branch Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" /> Branch Info
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'City',    value: branch.city     },
              { label: 'State',   value: branch.state    },
              { label: 'Region',  value: branch.region   },
              { label: 'Address', value: branch.address  },
              { label: 'Phone',   value: branch.phone    },
            ].filter(r => r.value).map(row => (
              <div key={row.label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{row.label}</p>
                <p className="text-gray-700 font-medium capitalize">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Staff */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Key Staff
          </h2>
          <div className="space-y-4">
            {[
              { person: storeHead, role: 'store_head',    label: 'Store Head'    },
              { person: manager,   role: 'store_manager', label: 'Store Manager' },
            ].map(({ person, role, label }) => (
              <div key={role}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
                {person ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: '#570439' }}>
                      {person.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{person.full_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{person.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-400 italic">Not assigned</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Order Trend
          </h2>
          {months.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-8">No orders yet</p>
          ) : (
            <div className="flex items-end gap-2 h-24">
              {months.map(([month, count]) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold text-gray-600">{count}</p>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${Math.round((count / maxCount) * 64)}px`,
                    backgroundColor: '#570439',
                    opacity: 0.6 + (count / maxCount) * 0.4,
                    minHeight: 3,
                  }} />
                  <p className="text-[9px] text-gray-400 text-center leading-tight">{month}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* All Users at this branch */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> All Staff ({branchUsers?.length || 0})
          </h2>
          {!branchUsers?.length ? (
            <p className="text-sm text-gray-400 italic text-center py-6">No staff assigned</p>
          ) : (
            <div className="space-y-3">
              {branchUsers.map((u: any) => {
                const initials = u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                return (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: '#570439' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{u.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" /> Recent Orders ({allOrders.length})
          </h2>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 italic">No orders for this branch</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-4 py-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(87,4,57,0.08)' }}>
                    <Package className="w-4 h-4" style={{ color: '#570439' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{shortId(o.id)}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(o.created_at)}
                      {o.items?.length ? <span> · {o.items.length} item{o.items.length !== 1 ? 's' : ''}</span> : null}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status as any} />
                </div>
              ))}
            </div>
          )}
          {allOrders.length > 10 && (
            <p className="text-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
              Showing 10 of {allOrders.length} orders
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
