'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, MapPin, ChevronRight, ShoppingBag, Search, X } from 'lucide-react'

interface StateData {
  state: string
  stores: any[]
  regions: string[]
  totalOrders: number
}

export default function BranchesGrid({ states }: { states: StateData[] }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = query.trim()
    ? states.filter(s =>
        s.state.toLowerCase().includes(query.toLowerCase()) ||
        s.regions.some(r => r.toLowerCase().includes(query.toLowerCase()))
      )
    : states

  return (
    <div>
      {/* Search */}
      <div className={`relative flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 mb-5 shadow-sm transition-all duration-200 ${
        focused ? 'border-[#570439] shadow-[0_0_0_3px_rgba(87,4,57,0.08)]' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <Search className={`w-4 h-4 shrink-0 transition-colors ${focused ? 'text-[#570439]' : 'text-gray-400'}`} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search state or region…"
          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No states match &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <Link key={s.state} href={`/dashboard/admin/branches?state=${encodeURIComponent(s.state)}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover group animate-fade-in-up"
              style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: 'rgba(87,4,57,0.1)' }}>
                  <MapPin className="w-5 h-5" style={{ color: '#570439' }} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-gray-800 group-hover:text-[#570439] transition-colors">{s.state}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {s.stores.length} store{s.stores.length !== 1 ? 's' : ''} · {s.regions.length} region{s.regions.length !== 1 ? 's' : ''}
              </p>
              {s.regions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.regions.slice(0, 4).map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize transition-colors group-hover:bg-[rgba(87,4,57,0.08)] group-hover:text-[#570439]">{r}</span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Store className="w-3 h-3" /> {s.stores.length}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <ShoppingBag className="w-3 h-3" /> {s.totalOrders} orders
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
