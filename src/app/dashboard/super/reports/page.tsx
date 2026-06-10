import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Package, TrendingUp, XCircle, Clock, Building2, Calendar } from 'lucide-react'

function getMonthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default async function SuperReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, scope_state')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const scopeState = (profile as any).scope_state as string | null

  // Fetch branches scoped to this super manager's state
  let branchQuery = supabase.from('branches').select('id, name, city, state').eq('company_id', profile.company_id).order('name')
  if (scopeState) branchQuery = branchQuery.eq('state', scopeState)
  const { data: branches } = await branchQuery

  const branchIds = (branches || []).map(b => b.id)

  const { data: orders } = branchIds.length === 0
    ? { data: [] }
    : await supabase
        .from('orders')
        .select('id, status, created_at, branch_id, items:order_items(id)')
        .eq('company_id', profile.company_id)
        .in('branch_id', branchIds)
        .order('created_at', { ascending: false })

  const allOrders   = orders   || []
  const allBranches = branches || []

  // ── Overall stats ──
  const totalOrders  = allOrders.length
  const pending      = allOrders.filter(o => o.status === 'submitted').length
  const approved     = allOrders.filter(o => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length
  const rejected     = allOrders.filter(o => o.status === 'rejected').length
  const approvalRate = totalOrders > 0 ? Math.round((approved / totalOrders) * 100) : 0
  const rejectionRate= totalOrders > 0 ? Math.round((rejected / totalOrders) * 100) : 0

  // ── Per branch ──
  const branchReport = allBranches.map(b => {
    const bOrders = allOrders.filter(o => o.branch_id === b.id)
    const bApproved = bOrders.filter(o => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length
    return {
      ...b,
      total:    bOrders.length,
      pending:  bOrders.filter(o => o.status === 'submitted').length,
      approved: bApproved,
      rejected: bOrders.filter(o => o.status === 'rejected').length,
      rate:     bOrders.length > 0 ? Math.round((bApproved / bOrders.length) * 100) : 0,
    }
  }).sort((a, b) => b.total - a.total)

  // ── Monthly breakdown (last 6 months) ──
  const now = new Date()
  const months: { label: string; total: number; approved: number; rejected: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const monthOrders = allOrders.filter(o => getMonthLabel(o.created_at) === label)
    months.push({
      label,
      total:    monthOrders.length,
      approved: monthOrders.filter(o => ['approved','packing','loaded','shipped','delivered'].includes(o.status)).length,
      rejected: monthOrders.filter(o => o.status === 'rejected').length,
    })
  }

  const maxMonthTotal = Math.max(...months.map(m => m.total), 1)

  return (
    <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Order analytics — {profile.scope_state} region</p>
      </div>

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Orders',   value: totalOrders,    icon: Package,   color: 'text-gray-700',   bg: 'bg-gray-50' },
          { label: 'Pending',        value: pending,        icon: Clock,     color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Approved',       value: approved,       icon: TrendingUp,color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Rejected',       value: rejected,       icon: XCircle,   color: 'text-red-500',    bg: 'bg-red-50' },
          { label: 'Approval Rate',  value: `${approvalRate}%`, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Monthly trend (last 6 months) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Monthly Trend — Last 6 Months</h2>
        </div>
        <div className="px-5 py-5">
          {/* Bar chart */}
          <div className="flex items-end gap-3 h-32">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-gray-600">{m.total || ''}</p>
                <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t-lg bg-purple-500 transition-all"
                    style={{ height: `${Math.max((m.total / maxMonthTotal) * 96, m.total > 0 ? 6 : 0)}px` }}
                  />
                </div>
                <p className="text-[9px] text-gray-400 text-center leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
              Total orders
            </div>
          </div>
        </div>

        {/* Monthly table */}
        <div className="overflow-x-auto border-t border-gray-50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Month</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-green-500 uppercase tracking-wide text-center">Approved</th>
                <th className="px-4 py-3 text-xs font-semibold text-red-400 uppercase tracking-wide text-center">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map(m => (
                <tr key={m.label} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-700">{m.label}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.total || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {m.approved > 0 ? <span className="font-semibold text-green-600">{m.approved}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.rejected > 0 ? <span className="font-semibold text-red-500">{m.rejected}</span> : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Branch performance ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Branch Performance</h2>
        </div>
        {branchReport.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">No data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-left">Branch</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-orange-400 uppercase tracking-wide text-center">Pending</th>
                  <th className="px-4 py-3 text-xs font-semibold text-green-500 uppercase tracking-wide text-center">Approved</th>
                  <th className="px-4 py-3 text-xs font-semibold text-red-400 uppercase tracking-wide text-center">Rejected</th>
                  <th className="px-4 py-3 text-xs font-semibold text-blue-400 uppercase tracking-wide text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branchReport.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.city}, {b.state}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{b.total}</td>
                    <td className="px-4 py-3 text-center">
                      {b.pending > 0 ? <span className="font-semibold text-orange-500">{b.pending}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.approved > 0 ? <span className="font-semibold text-green-600">{b.approved}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.rejected > 0 ? <span className="font-semibold text-red-500">{b.rejected}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        b.rate >= 75 ? 'bg-green-100 text-green-700' :
                        b.rate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {b.rate}%
                      </span>
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
