import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Store, Shield, Truck, ShieldCheck, User, MapPin,
  ChevronRight, ArrowLeft
} from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  admin:         'Admin',
  store_manager: 'Store Manager',
  store_head:    'Store Head',
  super_manager: 'Regional Manager',
  vendor:        'Vendor',
}
const ROLE_COLOR: Record<string, string> = {
  admin:         'bg-red-100 text-red-700',
  super_manager: 'bg-blue-100 text-blue-700',
  store_head:    'bg-violet-100 text-violet-700',
  store_manager: 'bg-green-100 text-green-700',
  vendor:        'bg-orange-100 text-orange-700',
}
const ROLE_ICON: Record<string, React.ElementType> = {
  admin: Shield, super_manager: ShieldCheck, store_head: ShieldCheck,
  store_manager: Store, vendor: Truck,
}
const ROLE_ORDER = ['admin', 'super_manager', 'store_head', 'store_manager', 'vendor']

export default async function AdminUsersPage({
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

  const { data: allUsers } = await supabase
    .from('users')
    .select('id,full_name,email,role,username,branch_id,scope_state,scope_region,branch:branches(id,name,city,state,region)')
    .eq('company_id', profile.company_id)
    .order('role').order('full_name')

  // Collect all unique states from branches
  const stateMap: Record<string, { state: string; regions: Set<string>; users: any[] }> = {}
  ;(allUsers || []).forEach(u => {
    const branch = Array.isArray(u.branch) ? u.branch[0] : u.branch
    const state  = branch?.state || u.scope_state || 'Other'
    const region = branch?.region || u.scope_region || ''
    if (!stateMap[state]) stateMap[state] = { state, regions: new Set(), users: [] }
    if (region) stateMap[state].regions.add(region)
    stateMap[state].users.push({ ...u, _state: state, _region: region })
  })

  // Apply filters
  const filteredUsers = (allUsers || []).filter(u => {
    const branch = Array.isArray(u.branch) ? u.branch[0] : u.branch
    const uState  = branch?.state  || u.scope_state  || 'Other'
    const uRegion = branch?.region || u.scope_region || ''
    if (selectedState && uState !== selectedState) return false
    if (selectedRegion && uRegion.toLowerCase() !== selectedRegion.toLowerCase()) return false
    return true
  })

  // ── LEVEL 2+: State (+ optional region) selected ──
  if (selectedState) {
    const byRole: Record<string, any[]> = {}
    filteredUsers.forEach(u => {
      if (!byRole[u.role]) byRole[u.role] = []
      byRole[u.role].push(u)
    })

    const regionMap: Record<string, number> = {}
    if (!selectedRegion) {
      filteredUsers.forEach(u => {
        const branch = Array.isArray(u.branch) ? u.branch[0] : u.branch
        const r = branch?.region || u.scope_region || 'General'
        regionMap[r] = (regionMap[r] || 0) + 1
      })
    }

    return (
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/dashboard/admin/users" className="hover:text-gray-700 transition-colors">All States</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {selectedRegion ? (
            <>
              <Link href={`/dashboard/admin/users?state=${encodeURIComponent(selectedState)}`}
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
            <p className="text-sm text-gray-400 mt-0.5">{filteredUsers.length} users</p>
          </div>
          <Link href={selectedRegion
            ? `/dashboard/admin/users?state=${encodeURIComponent(selectedState)}`
            : '/dashboard/admin/users'}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        {/* Region filter chips (only if no region selected) */}
        {!selectedRegion && Object.keys(regionMap).length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-xs text-gray-400 self-center mr-1">Filter by region:</span>
            {Object.entries(regionMap).map(([r, count]) => (
              <Link key={r} href={`/dashboard/admin/users?state=${encodeURIComponent(selectedState)}&region=${encodeURIComponent(r)}`}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-[#570439] hover:text-[#570439] transition-colors capitalize">
                {r} ({count})
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {ROLE_ORDER.filter(r => byRole[r]?.length).map(role => {
            const Icon = ROLE_ICON[role] || User
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{ROLE_LABEL[role]}</h2>
                  <span className="text-xs text-gray-400">({byRole[role].length})</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {byRole[role].map((u: any) => {
                      const branch = Array.isArray(u.branch) ? u.branch[0] : u.branch
                      const initials = u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                      return (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: '#570439' }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                          <div className="hidden sm:block text-right shrink-0">
                            {branch && (
                              <Link href={`/dashboard/admin/branches/${branch.id}`}
                                className="text-xs text-blue-600 hover:underline truncate max-w-[140px] block">{branch.name}</Link>
                            )}
                            {u.username && <p className="text-[10px] text-gray-300">@{u.username}</p>}
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LEVEL 1: All States ──
  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allUsers?.length || 0} total · {Object.keys(stateMap).length} states</p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLE_ORDER.filter(r => (allUsers || []).some(u => u.role === r)).map(role => {
          const count = (allUsers || []).filter(u => u.role === role).length
          return (
            <span key={role} className={`text-xs font-bold px-3 py-1.5 rounded-full ${ROLE_COLOR[role] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABEL[role]} ({count})
            </span>
          )
        })}
      </div>

      {/* State cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(stateMap).map(([state, data]) => (
          <Link key={state} href={`/dashboard/admin/users?state=${encodeURIComponent(state)}`}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(87,4,57,0.1)' }}>
                <MapPin className="w-5 h-5" style={{ color: '#570439' }} />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-gray-800 group-hover:text-[#570439] transition-colors">{state}</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {data.users.length} user{data.users.length !== 1 ? 's' : ''}
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
    </div>
  )
}
