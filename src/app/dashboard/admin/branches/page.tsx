import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Store, MapPin, ChevronRight, Users, ShoppingBag, ArrowLeft } from 'lucide-react'
import BranchesGrid from '@/components/admin/BranchesGrid'

export default async function AdminBranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; region?: string }>
}) {
  const { state: selectedState, region: selectedRegion } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: branches } = await supabase
    .from('branches')
    .select('id,name,city,state,region,address')
    .eq('company_id', profile.company_id)
    .order('state').order('region').order('city')

  const { data: allUsers } = await supabase
    .from('users')
    .select('id,full_name,role,branch_id')
    .eq('company_id', profile.company_id)
    .in('role', ['store_manager', 'store_head'])

  const { data: orderCounts } = await supabase
    .from('orders')
    .select('id,branch_id,status')

  const usersByBranch: Record<string, any[]> = {}
  ;(allUsers || []).forEach(u => {
    if (!u.branch_id) return
    if (!usersByBranch[u.branch_id]) usersByBranch[u.branch_id] = []
    usersByBranch[u.branch_id].push(u)
  })

  const ordersByBranch: Record<string, number> = {}
  ;(orderCounts || []).forEach(o => {
    ordersByBranch[o.branch_id] = (ordersByBranch[o.branch_id] || 0) + 1
  })

  const allBranches = branches || []

  // ── LEVEL 3: Region selected — show stores in state+region ──
  if (selectedState && selectedRegion) {
    const filtered = allBranches.filter(
      b => b.state === selectedState && (b.region || '').toLowerCase() === selectedRegion.toLowerCase()
    )
    return (
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard/admin/branches" className="hover:text-gray-700 transition-colors">All States</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/dashboard/admin/branches?state=${encodeURIComponent(selectedState)}`}
            className="hover:text-gray-700 transition-colors">{selectedState}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-semibold capitalize">{selectedRegion} Region</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{selectedRegion} Region</h1>
            <p className="text-sm text-gray-400 mt-0.5">{selectedState} · {filtered.length} store{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href={`/dashboard/admin/branches?state=${encodeURIComponent(selectedState)}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b: any) => {
            const branchUsers = usersByBranch[b.id] || []
            const manager = branchUsers.find(u => u.role === 'store_manager')
            const head    = branchUsers.find(u => u.role === 'store_head')
            const orders  = ordersByBranch[b.id] || 0
            return (
              <Link key={b.id} href={`/dashboard/admin/branches/${b.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#570439' }}>
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#570439] transition-colors">{b.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{b.city}, {b.state}</p>
                {b.address && <p className="text-[11px] text-gray-300 mt-0.5 truncate">{b.address}</p>}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400 space-y-0.5">
                    <p>👤 {manager?.full_name || <span className="italic text-red-400">No manager</span>}</p>
                    <p>🛡 {head?.full_name     || <span className="italic text-red-400">No store head</span>}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: '#570439' }}>{orders}</p>
                    <p className="text-[10px] text-gray-400">orders</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LEVEL 2: State selected — show regions ──
  if (selectedState) {
    const stateBranches = allBranches.filter(b => b.state === selectedState)
    const regions: Record<string, any[]> = {}
    stateBranches.forEach(b => {
      const r = b.region || 'General'
      if (!regions[r]) regions[r] = []
      regions[r].push(b)
    })

    return (
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard/admin/branches" className="hover:text-gray-700 transition-colors">All States</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-semibold">{selectedState}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedState}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{stateBranches.length} stores · {Object.keys(regions).length} regions</p>
          </div>
          <Link href="/dashboard/admin/branches"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All States
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(regions).map(([region, stores]) => {
            const totalOrders = stores.reduce((s, b) => s + (ordersByBranch[b.id] || 0), 0)
            const totalUsers  = stores.reduce((s, b) => s + (usersByBranch[b.id]?.length || 0), 0)
            return (
              <Link key={region}
                href={`/dashboard/admin/branches?state=${encodeURIComponent(selectedState)}&region=${encodeURIComponent(region)}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 capitalize group-hover:text-blue-700 transition-colors">
                  {region} Region
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Store className="w-3 h-3" /> {stores.length} stores
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <ShoppingBag className="w-3 h-3" /> {totalOrders} orders
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Users className="w-3 h-3" /> {totalUsers} users
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LEVEL 1: Show all states ──
  const statesMap: Record<string, any[]> = {}
  allBranches.forEach(b => {
    const s = b.state || 'Other'
    if (!statesMap[s]) statesMap[s] = []
    statesMap[s].push(b)
  })

  const statesData = Object.entries(statesMap).map(([state, stateBranches]) => ({
    state,
    stores: stateBranches,
    regions: [...new Set(stateBranches.map((b: any) => b.region).filter(Boolean))] as string[],
    totalOrders: stateBranches.reduce((s: number, b: any) => s + (ordersByBranch[b.id] || 0), 0),
  }))

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {allBranches.length} stores · {statesData.length} states
        </p>
      </div>
      <BranchesGrid states={statesData} />
    </div>
  )
}
