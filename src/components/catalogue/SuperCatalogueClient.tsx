'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Tag, ChevronRight, ShoppingBag, Store, CheckCircle2, Search, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

interface Branch {
  id: string
  name: string
  city: string
  state: string
}

interface Category {
  id: string
  name: string
}

interface Props {
  branches: Branch[]
  categories: Category[]
  userId: string
}

export default function SuperCatalogueClient({ branches, categories, userId }: Props) {
  const { selectedBranchId, setSelectedBranchId, initForUser } = useCartStore()
  const [localBranch, setLocalBranch]   = useState(selectedBranchId)
  const [query, setQuery]               = useState('')
  const [open, setOpen]                 = useState(false)
  const containerRef                    = useRef<HTMLDivElement>(null)

  // Load this user's persisted cart on mount, then sync branch UI
  useEffect(() => {
    initForUser(userId)
  }, [userId])

  // Sync from store on mount
  useEffect(() => {
    setLocalBranch(selectedBranchId)
    const b = branches.find(b => b.id === selectedBranchId)
    if (b) setQuery(`${b.name} — ${b.city}`)
  }, [selectedBranchId])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const selectedBranch = branches.find(b => b.id === localBranch)

  const filtered = query.trim() === '' || (selectedBranch && query === `${selectedBranch.name} — ${selectedBranch.city}`)
    ? branches
    : branches.filter(b =>
        `${b.name} ${b.city} ${b.state}`.toLowerCase().includes(query.toLowerCase())
      )

  function handleSelect(b: Branch) {
    setLocalBranch(b.id)
    setSelectedBranchId(b.id)
    setQuery(`${b.name} — ${b.city}`)
    setOpen(false)
  }

  function handleClear() {
    setLocalBranch('')
    setSelectedBranchId('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#f5f0e8' }}>
          <ShoppingBag className="w-5 h-5" style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Materials</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {localBranch ? 'Select a category to browse products' : 'First select a store to order for'}
          </p>
        </div>
      </div>

      {/* Step 1 — Branch selector */}
      <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${localBranch ? 'border-green-200' : 'border-[#c9a84c]'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${localBranch ? 'bg-green-500 text-white' : 'bg-[#c9a84c] text-white'}`}>
            {localBranch ? <CheckCircle2 className="w-4 h-4" /> : '1'}
          </div>
          <p className="text-sm font-semibold text-gray-800">Select Store</p>
          {!localBranch && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 ml-1">Required</span>
          )}
        </div>

        {/* Searchable combobox */}
        <div ref={containerRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            placeholder="Type to search store..."
            onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) handleClear() }}
            onFocus={() => setOpen(true)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] transition-all"
          />
          {query && (
            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">No stores found</div>
              ) : (
                filtered.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleSelect(b)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${b.id === localBranch ? 'bg-[#f5f0e8]' : ''}`}
                  >
                    <Store className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
                      <p className="text-xs text-gray-400 truncate">{b.city}, {b.state}</p>
                    </div>
                    {b.id === localBranch && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedBranch && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ordering for: <span className="font-semibold">{selectedBranch.name}</span>
          </p>
        )}
      </div>

      {/* Step 2 — Categories (only show after branch selected) */}
      {localBranch ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#570439] text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p className="text-sm font-semibold text-gray-800">Select Category</p>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
              <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No categories available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/dashboard/super/catalogue/${cat.id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between hover:border-[#c9a84c] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f5f0e8] rounded-xl flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-colors">
                      <Tag className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#c9a84c] transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Locked state */
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
          <Tag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-400">Categories will appear here</p>
          <p className="text-xs text-gray-300 mt-1">Select a store above to continue</p>
        </div>
      )}
    </div>
  )
}
