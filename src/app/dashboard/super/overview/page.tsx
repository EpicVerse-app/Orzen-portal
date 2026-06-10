import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, Package, Clock, CheckCircle, XCircle, TrendingUp, MapPin } from 'lucide-react'

export default async function SuperOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, role, company_id, scope_state, scope_region,
      company:companies(id, name, logo_url)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  const scopeState  = (profile as any).scope_state  as string | null
  const scopeRegion = (profile as any).scope_region as string | null

  // Fetch branches scoped to this super manager's state + region
  let branchQuery = supabase.from('branches').select('id, name, city, state, region').eq('company_id', profile.company_id).order('name')
  if (scopeState)  branchQuery = branchQuery.eq('state', scopeState)
  if (scopeRegion) branchQuery = branchQuery.eq('region', scopeRegion)
  const { data: branches } = await branchQuery

  const branchIds = (branches || []).map(b => b.id)

  // Fetch orders scoped to those branches
  const { data: orders } = branchIds.length === 0
    ? { data: [] }
    : await supabase
        .from('orders')
        .select('id, status, created_at, branch_id, branch:branches(id, name, city)')
        .eq('company_id', profile.company_id)
        .in('branch_id', branchIds)
        .order('created_at', { ascending: false })

  const allBranches = branches || []
  const allOrders   = orders   || []

  // Stats
  const stats = {
    total:    allOrders.length,
    pending:  allOrders.filter(o => o.status === 'submitted').length,
    approved: allOrders.filter(o => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length,
    rejected: allOrders.filter(o => o.status === 'rejected').length,
  }

  // Per-branch order counts
  const branchStats = allBranches.map(branch => {
    const bOrders = allOrders.filter(o => o.branch_id === branch.id)
    return {
      ...branch,
      total:    bOrders.length,
      pending:  bOrders.filter(o => o.status === 'submitted').length,
      approved: bOrders.filter(o => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length,
      rejected: bOrders.filter(o => o.status === 'rejected').length,
    }
  }).sort((a, b) => b.total - a.total)

  // Group by state
  const states = [...new Set(allBranches.map(b => b.state).filter(Boolean))]

  return (
    <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">{company?.name} — Full company summary</p>
      </div>

      {/* Company info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap gap-6 items-center">
        {company?.logo_url && (
          <img src={company.logo_url} alt={company.name} className="h-12 w-auto object-contain" />
        )}
        <div className="space-y-1">
          <p className="text-lg font-bold text-gray-800">{company?.name}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              {allBranches.length} Stores
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-purple-400" />
              {states.length} State{states.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-gray-400" />
              {stats.total} Total Orders
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: stats.total,    color: 'text-gray-800',   bg: 'bg-gray-50',   icon: Package },
          { label: 'Pending',      value: stats.pending,  color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock },
          { label: 'Approved',     value: stats.approved, color: 'text-green-600',  bg: 'bg-green-50',  icon: TrendingUp },
          { label: 'Rejected',     value: stats.rejected, color: 'text-red-500',    bg: 'bg-red-50',    icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch-wise breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Orders by Store</h2>
        </div>
        {branchStats.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No stores found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Store</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-orange-400 uppercase tracking-wide text-center">Pending</th>
                  <th className="px-4 py-3 text-xs font-semibold text-green-500 uppercase tracking-wide text-center">Approved</th>
                  <th className="px-4 py-3 text-xs font-semibold text-red-400 uppercase tracking-wide text-center">Rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branchStats.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.city}, {b.state}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{b.total}</td>
                    <td className="px-4 py-3 text-center">
                      {b.pending > 0
                        ? <span className="font-semibold text-orange-500">{b.pending}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.approved > 0
                        ? <span className="font-semibold text-green-600">{b.approved}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.rejected > 0
                        ? <span className="font-semibold text-red-500">{b.rejected}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
