import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Store, Shield, Truck, ShieldCheck, User, MapPin,
  ChevronRight, ArrowLeft
} from 'lucide-react'
import UsersTable from '@/components/admin/UsersTable'

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
            <span className="text-xs text-gray-400 self-center mr-1">Region:</span>
            {Object.entries(regionMap).map(([r, count]) => (
              <Link key={r} href={`/dashboard/admin/users?state=${encodeURIComponent(selectedState)}&region=${encodeURIComponent(r)}`}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#570439] hover:text-[#570439] transition-colors capitalize font-medium">
                {r} ({count})
              </Link>
            ))}
          </div>
        )}

        <UsersTable users={filteredUsers} />
      </div>
    )
  }

  // ── LEVEL 1: All Users with interactive search/filter ──
  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allUsers?.length || 0} total across {Object.keys(stateMap).length} states</p>
      </div>
      <UsersTable users={allUsers || []} />
    </div>
  )
}
