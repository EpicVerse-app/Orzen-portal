'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X, Store, Shield, Truck, ShieldCheck, User } from 'lucide-react'

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

interface Props {
  users: any[]
}

export default function UsersTable({ users }: Props) {
  const [query,      setQuery]      = useState('')
  const [activeRole, setActiveRole] = useState('all')
  const [focused,    setFocused]    = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const availableRoles = ROLE_ORDER.filter(r => users.some(u => u.role === r))

  const filtered = users.filter(u => {
    const matchRole  = activeRole === 'all' || u.role === activeRole
    const q          = query.toLowerCase()
    const matchQuery = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    return matchRole && matchQuery
  })

  const byRole: Record<string, any[]> = {}
  filtered.forEach(u => {
    if (!byRole[u.role]) byRole[u.role] = []
    byRole[u.role].push(u)
  })

  return (
    <div>
      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className={`relative flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 shadow-sm transition-all duration-200 flex-1 ${
          focused ? 'border-[#570439] shadow-[0_0_0_3px_rgba(87,4,57,0.08)]' : 'border-gray-200 hover:border-gray-300'
        }`}>
          <Search className={`w-4 h-4 shrink-0 transition-colors ${focused ? 'text-[#570439]' : 'text-gray-400'}`} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search name, email, username…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* Role pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveRole('all')}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
              activeRole === 'all' ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={activeRole === 'all' ? { backgroundColor: '#570439' } : {}}
          >
            All ({users.length})
          </button>
          {availableRoles.map(r => {
            const count = users.filter(u => u.role === r).length
            return (
              <button key={r}
                onClick={() => setActiveRole(activeRole === r ? 'all' : r)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeRole === r ? 'text-white shadow-sm' : `${ROLE_COLOR[r]} hover:opacity-80`
                }`}
                style={activeRole === r ? { backgroundColor: '#570439' } : {}}
              >
                {ROLE_LABEL[r]} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <User className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No users match your search</p>
        </div>
      ) : (
        <div className="space-y-5">
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
                  {byRole[role].map((u: any, i: number) => {
                    const branch   = Array.isArray(u.branch) ? u.branch[0] : u.branch
                    const initials = u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                    const isOpen   = expanded === u.id

                    return (
                      <div key={u.id}
                        className={`border-b border-gray-50 last:border-0 transition-colors ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        {/* Main row */}
                        <button
                          onClick={() => setExpanded(isOpen ? null : u.id)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                        >
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 transition-transform duration-150"
                            style={{ backgroundColor: '#570439', transform: isOpen ? 'scale(1.08)' : 'scale(1)' }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                          <span className={`text-gray-400 transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {/* Expanded details */}
                        {isOpen && (
                          <div className="px-5 pb-4 animate-fade-in-up" style={{ opacity: 0 }}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                              {u.email && (
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Email</p>
                                  <p className="text-xs text-gray-700 truncate">{u.email}</p>
                                </div>
                              )}
                              {u.username && (
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Username</p>
                                  <p className="text-xs text-gray-700">@{u.username}</p>
                                </div>
                              )}
                              {branch && (
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Branch</p>
                                  <Link href={`/dashboard/admin/branches/${branch.id}`}
                                    className="text-xs text-blue-600 hover:underline">{branch.name}</Link>
                                </div>
                              )}
                              {u.scope_state && (
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Scope</p>
                                  <p className="text-xs text-gray-700">{u.scope_state}{u.scope_region ? ` · ${u.scope_region}` : ''}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
