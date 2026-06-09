import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Calendar, ChevronRight, MapPin, ArrowLeft } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) { return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase() }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const STATUS_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'submitted', label: 'Pending'   },
  { key: 'approved',  label: 'Approved'  },
  { key: 'shipped',   label: 'In Transit'},
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected',  label: 'Rejected'  },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; state?: string; region?: string }>
}) {
  const { status, state: selectedState, region: selectedRegion } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch all orders (with branch info for filtering)
  let query = supabase
    .from('orders')
    .select('id,status,created_at,branch_id,branch:branches(id,name,city,state,region),items:order_items(id)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data: orders } = await query
  const allOrders = orders || []

  // Build state map (from orders)
  const stateMap: Record<string, { regions: Set<string>; count: number }> = {}
  allOrders.forEach((o: any) => {
    const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
    if (!branch) return
    const s = branch.state || 'Other'
    const r = branch.region || ''
    if (!stateMap[s]) stateMap[s] = { regions: new Set(), count: 0 }
    if (r) stateMap[s].regions.add(r)
    stateMap[s].count++
  })

  // Apply region/state filter
  const filteredOrders = allOrders.filter((o: any) => {
    const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
    if (!branch) return !selectedState
    if (selectedState && branch.state !== selectedState) return false
    if (selectedRegion && (branch.region || '').toLowerCase() !== selectedRegion.toLowerCase()) return false
    return true
  })

  const activeTab = status || 'all'

  // Build filter URL helper
  function filterUrl(newStatus?: string) {
    const params = new URLSearchParams()
    if (newStatus && newStatus !== 'all') params.set('status', newStatus)
    if (selectedState) params.set('state', selectedState)
    if (selectedRegion) params.set('region', selectedRegion)
    const q = params.toString()
    return `/dashboard/admin/orders${q ? '?' + q : ''}`
  }

  // ── LEVEL 1: No state selected — show states overview ──
  if (!selectedState) {
    return (
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{allOrders.length} total orders · {Object.keys(stateMap).length} states</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map(tab => (
            <Link key={tab.key}
              href={tab.key === 'all' ? '/dashboard/admin/orders' : `/dashboard/admin/orders?status=${tab.key}`}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={activeTab === tab.key ? { backgroundColor: '#570439' } : {}}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* State cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(stateMap).map(([state, data]) => (
            <Link key={state}
              href={`/dashboard/admin/orders?state=${encodeURIComponent(state)}${status && status !== 'all' ? '&status=' + status : ''}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(87,4,57,0.1)' }}>
                  <MapPin className="w-5 h-5" style={{ color: '#570439' }} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-gray-800 group-hover:text-[#570439] transition-colors">{state}</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {data.count} order{data.count !== 1 ? 's' : ''}
                {data.regions.size > 0 && <> · {data.regions.size} region{data.regions.size !== 1 ? 's' : ''}</>}
              </p>
              {data.regions.size > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {[...data.regions].slice(0, 4).map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{r}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Orders list */}
        <OrderList orders={filteredOrders} activeTab={activeTab} filterUrl={filterUrl} showRegion />
      </div>
    )
  }

  // ── LEVEL 2+: State selected ──
  const regionMap: Record<string, number> = {}
  filteredOrders.forEach((o: any) => {
    const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
    const r = branch?.region || 'General'
    regionMap[r] = (regionMap[r] || 0) + 1
  })

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/dashboard/admin/orders" className="hover:text-gray-700 transition-colors">All States</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        {selectedRegion ? (
          <>
            <Link href={`/dashboard/admin/orders?state=${encodeURIComponent(selectedState)}${status && status !== 'all' ? '&status=' + status : ''}`}
              className="hover:text-gray-700 transition-colors">{selectedState}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-semibold capitalize">{selectedRegion} Region</span>
          </>
        ) : (
          <span className="text-gray-700 font-semibold">{selectedState}</span>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedRegion ? <span className="capitalize">{selectedRegion} Region</span> : selectedState}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{filteredOrders.length} orders</p>
        </div>
        <Link href={selectedRegion
          ? `/dashboard/admin/orders?state=${encodeURIComponent(selectedState)}${status && status !== 'all' ? '&status=' + status : ''}`
          : '/dashboard/admin/orders'}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <Link key={tab.key} href={filterUrl(tab.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={activeTab === tab.key ? { backgroundColor: '#570439' } : {}}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Region chips (only if no region selected) */}
      {!selectedRegion && Object.keys(regionMap).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-gray-400 self-center mr-1">Region:</span>
          {Object.entries(regionMap).map(([r, count]) => (
            <Link key={r}
              href={`/dashboard/admin/orders?state=${encodeURIComponent(selectedState)}&region=${encodeURIComponent(r)}${status && status !== 'all' ? '&status=' + status : ''}`}
              className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-[#570439] hover:text-[#570439] transition-colors capitalize">
              {r} ({count})
            </Link>
          ))}
        </div>
      )}

      <OrderList orders={filteredOrders} activeTab={activeTab} filterUrl={filterUrl} showRegion={!selectedRegion} />
    </div>
  )
}

// ── Shared order list component ──
function OrderList({
  orders,
  activeTab,
  filterUrl,
  showRegion,
}: {
  orders: any[]
  activeTab: string
  filterUrl: (s?: string) => string
  showRegion?: boolean
}) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
        <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No orders found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-50">
        {orders.map((o: any) => {
          const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
          return (
            <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{shortId(o.id)}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {fmtDate(o.created_at)}
                  {branch && (
                    <>
                      <span>·</span>
                      <Link href={`/dashboard/admin/branches/${branch.id}`}
                        className="text-blue-500 hover:underline">
                        {branch.name}
                      </Link>
                      {showRegion && branch.region && (
                        <span className="capitalize text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{branch.region}</span>
                      )}
                    </>
                  )}
                  {o.items?.length ? <><span>·</span><span>{o.items.length} items</span></> : null}
                </p>
              </div>
              <OrderStatusBadge status={o.status as any} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
