import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Store, Shield, Truck, ShieldCheck, User } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', store_manager: 'Store Manager', store_head: 'Store Head',
  super_manager: 'Regional Manager', vendor: 'Vendor',
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

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: allUsers } = await supabase
    .from('users')
    .select('id,full_name,email,role,username,branch_id,scope_state,scope_region,branch:branches(name,city)')
    .eq('company_id', profile.company_id)
    .order('role').order('full_name')

  const byRole: Record<string, any[]> = {}
  ;(allUsers || []).forEach(u => {
    if (!byRole[u.role]) byRole[u.role] = []
    byRole[u.role].push(u)
  })

  const totalByRole = ROLE_ORDER.map(r => ({ role: r, count: byRole[r]?.length || 0 }))

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-400 mt-0.5">{allUsers?.length || 0} total users</p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {totalByRole.filter(r => r.count > 0).map(({ role, count }) => (
          <span key={role} className={`text-xs font-bold px-3 py-1.5 rounded-full ${ROLE_COLOR[role] || 'bg-gray-100 text-gray-600'}`}>
            {ROLE_LABEL[role] || role} ({count})
          </span>
        ))}
      </div>

      {/* Users by role */}
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
                            <p className="text-xs text-gray-500 truncate max-w-[140px]">{branch.name}</p>
                          )}
                          {u.scope_state && (
                            <p className="text-xs text-gray-400">{u.scope_state}{u.scope_region ? ` · ${u.scope_region}` : ''}</p>
                          )}
                          {u.username && (
                            <p className="text-[10px] text-gray-300">@{u.username}</p>
                          )}
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
