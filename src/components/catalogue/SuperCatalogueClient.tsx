'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Tag, ChevronRight, ShoppingBag, Store, CheckCircle2, ChevronDown } from 'lucide-react'
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
}

export default function SuperCatalogueClient({ branches, categories }: Props) {
  const { selectedBranchId, setSelectedBranchId } = useCartStore()
  const [localBranch, setLocalBranch] = useState(selectedBranchId)

  // Sync from store on mount
  useEffect(() => {
    setLocalBranch(selectedBranchId)
  }, [selectedBranchId])

  const selectedBranch = branches.find(b => b.id === localBranch)

  function handleBranchChange(id: string) {
    setLocalBranch(id)
    setSelectedBranchId(id)
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

        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={localBranch}
            onChange={e => handleBranchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40 focus:border-[#c9a84c] transition-all"
          >
            <option value="">— Choose a store —</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}, {b.state}
              </option>
            ))}
          </select>
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
