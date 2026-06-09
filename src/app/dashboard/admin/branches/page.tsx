import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Store, MapPin, User, ChevronRight } from 'lucide-react'

export default async function AdminBranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: branches } = await supabase
    .from('branches')
    .select('id,name,city,state,region,address')
    .eq('company_id', profile.company_id)
    .order('state').order('city')

  const { data: allUsers } = await supabase
    .from('users')
    .select('id,full_name,role,branch_id')
    .eq('company_id', profile.company_id)
    .in('role', ['store_manager', 'store_head'])

  const usersByBranch: Record<string, any[]> = {}
  ;(allUsers || []).forEach(u => {
    if (!u.branch_id) return
    if (!usersByBranch[u.branch_id]) usersByBranch[u.branch_id] = []
    usersByBranch[u.branch_id].push(u)
  })

  const byState: Record<string, any[]> = {}
  ;(branches || []).forEach(b => {
    const s = b.state || 'Other'
    if (!byState[s]) byState[s] = []
    byState[s].push(b)
  })

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-400 mt-0.5">{branches?.length || 0} stores across India</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(byState).map(([state, stateBranches]) => (
          <div key={state}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{state}</h2>
              <span className="text-xs text-gray-400">({stateBranches.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stateBranches.map((b: any) => {
                const branchUsers = usersByBranch[b.id] || []
                const manager = branchUsers.find(u => u.role === 'store_manager')
                const head    = branchUsers.find(u => u.role === 'store_head')
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                        <Store className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.city}{b.state ? `, ${b.state}` : ''}</p>
                        {b.region && <p className="text-[10px] text-gray-300 mt-0.5">{b.region}</p>}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-300 shrink-0" />
                        <p className="text-[11px] text-gray-500 truncate">
                          <span className="text-gray-400">Manager: </span>
                          {manager ? manager.full_name : <span className="text-red-400 italic">Not assigned</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-300 shrink-0" />
                        <p className="text-[11px] text-gray-500 truncate">
                          <span className="text-gray-400">Store Head: </span>
                          {head ? head.full_name : <span className="text-red-400 italic">Not assigned</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {!branches?.length && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
            <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No branches found</p>
          </div>
        )}
      </div>
    </div>
  )
}
