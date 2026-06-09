import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, TrendingUp, Package, Store, CheckCircle, Truck, Clock } from 'lucide-react'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [
    { data: orders },
    { data: branches },
    { data: products },
  ] = await Promise.all([
    supabase.from('orders').select('id,status,created_at,branch:branches(name,city,state)'),
    supabase.from('branches').select('id,name,city,state').eq('company_id', profile.company_id),
    supabase.from('products').select('id,name,unit').eq('company_id', profile.company_id),
  ])

  const allOrders = orders || []

  // Orders by status
  const byStatus: Record<string, number> = {}
  allOrders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })

  // Orders by branch
  const byBranch: Record<string, { name: string; count: number }> = {}
  allOrders.forEach((o: any) => {
    const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
    if (!branch) return
    if (!byBranch[branch.name]) byBranch[branch.name] = { name: branch.name, count: 0 }
    byBranch[branch.name].count++
  })
  const topBranches = Object.values(byBranch).sort((a, b) => b.count - a.count).slice(0, 5)
  const maxBranchCount = topBranches[0]?.count || 1

  // Orders by month (last 6 months)
  const monthMap: Record<string, number> = {}
  allOrders.forEach(o => {
    const m = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    monthMap[m] = (monthMap[m] || 0) + 1
  })
  const months = Object.entries(monthMap).slice(-6)
  const maxMonthCount = Math.max(...months.map(([,c]) => c), 1)

  const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    submitted: { label: 'Pending',    icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
    approved:  { label: 'Approved',   icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50'   },
    shipped:   { label: 'In Transit', icon: Truck,        color: 'text-purple-600', bg: 'bg-purple-50' },
    delivered: { label: 'Delivered',  icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50'  },
    rejected:  { label: 'Rejected',   icon: Clock,        color: 'text-red-500',    bg: 'bg-red-50'    },
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of orders and performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders',  value: allOrders.length,   icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Branches', value: branches?.length||0, icon: Store,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Total Products', value: products?.length||0, icon: Package, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Delivered',      value: byStatus['delivered']||0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" /> Orders by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = byStatus[status] || 0
              const pct   = Math.round((count / (allOrders.length || 1)) * 100)
              const Icon  = meta.icon
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span className="text-xs text-gray-600">{meta.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${meta.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top branches */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Top Branches by Orders
          </h2>
          <div className="space-y-3">
            {topBranches.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No data yet</p>}
            {topBranches.map((b, i) => (
              <div key={b.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 truncate">{i + 1}. {b.name}</span>
                  <span className="text-xs font-bold text-gray-700 shrink-0 ml-2">{b.count}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${Math.round((b.count / maxBranchCount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders over time */}
      {months.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Orders Over Time
          </h2>
          <div className="flex items-end gap-3 h-32">
            {months.map(([month, count]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                <p className="text-xs font-bold text-gray-600">{count}</p>
                <div className="w-full rounded-t-lg transition-all" style={{
                  height: `${Math.round((count / maxMonthCount) * 96)}px`,
                  backgroundColor: '#570439',
                  opacity: 0.7 + (count / maxMonthCount) * 0.3,
                  minHeight: 4,
                }} />
                <p className="text-[10px] text-gray-400 text-center">{month}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
