'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Package, Tag, Building2, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Result {
  type: 'product' | 'category' | 'branch' | 'order'
  id: string
  title: string
  subtitle: string
  href: string
}

interface Props {
  companyId: string
}

export default function SuperSearchBar({ companyId }: Props) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<Result[]>([])
  const [loading, setLoading]     = useState(false)
  const [showDrop, setShowDrop]   = useState(false)
  const [showMobile, setShowMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Focus input when mobile search opens
  useEffect(() => {
    if (showMobile) inputRef.current?.focus()
  }, [showMobile])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); return }
    setLoading(true)

    const supabase = createClient()
    const term = `%${q}%`

    const [products, categories, branches, orders] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, unit')
        .eq('company_id', companyId)
        .ilike('name', term)
        .limit(4),

      supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', companyId)
        .ilike('name', term)
        .limit(4),

      supabase
        .from('branches')
        .select('id, name, city, state')
        .eq('company_id', companyId)
        .or(`name.ilike.${term},city.ilike.${term}`)
        .limit(4),

      supabase
        .from('orders')
        .select('id, status, branch:branches(name)')
        .eq('company_id', companyId)
        .limit(4),
    ])

    const all: Result[] = [
      ...(products.data || []).map(p => ({
        type: 'product' as const,
        id: p.id,
        title: p.name,
        subtitle: p.unit || 'Product',
        href: `/dashboard/super/catalogue`,
      })),
      ...(categories.data || []).map(c => ({
        type: 'category' as const,
        id: c.id,
        title: c.name,
        subtitle: 'Category',
        href: `/dashboard/super/catalogue/${c.id}`,
      })),
      ...(branches.data || []).map(b => ({
        type: 'branch' as const,
        id: b.id,
        title: b.name,
        subtitle: `${b.city}, ${b.state}`,
        href: `/dashboard/super/branches`,
      })),
      ...(orders.data || [])
        .filter(o => `ORD-${o.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`.toLowerCase().includes(q.toLowerCase()))
        .map(o => ({
          type: 'order' as const,
          id: o.id,
          title: `ORD-${o.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
          subtitle: `${(o.branch as any)?.name || ''} · ${o.status}`,
          href: `/dashboard/super/orders`,
        })),
    ]

    setResults(all)
    setShowDrop(true)
    setLoading(false)
  }, [companyId])

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(href: string) {
    setQuery('')
    setResults([])
    setShowDrop(false)
    setShowMobile(false)
    router.push(href)
  }

  function clear() {
    setQuery('')
    setResults([])
    setShowDrop(false)
    inputRef.current?.focus()
  }

  const ICON: Record<Result['type'], React.ElementType> = {
    product:  Package,
    category: Tag,
    branch:   Building2,
    order:    ShoppingBag,
  }

  const SECTION_LABEL: Record<Result['type'], string> = {
    product:  'Products',
    category: 'Categories',
    branch:   'Branches',
    order:    'Orders',
  }

  // Group results by type
  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  const SearchInput = ({ className = '' }: { className?: string }) => (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="flex items-center gap-2 rounded-xl px-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <Search className="w-4 h-4 text-white/50 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => query && setShowDrop(true)}
          placeholder="Search products, categories, branches…"
          className="bg-transparent text-sm text-white placeholder-white/40 outline-none w-full py-2"
        />
        {query && (
          <button onClick={clear} className="text-white/40 hover:text-white/80">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDrop && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {SECTION_LABEL[type as Result['type']]}
                </p>
                {items.map(item => {
                  const Icon = ICON[item.type]
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop — centered in header */}
      <SearchInput className="absolute left-1/2 -translate-x-1/2 w-[280px] lg:w-[400px] hidden md:block" />

      {/* Mobile toggle button */}
      <button
        className="md:hidden text-white/70 hover:text-white p-1 shrink-0"
        onClick={() => setShowMobile(!showMobile)}
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile expanded bar */}
      {showMobile && (
        <div
          className="fixed top-14 left-0 right-0 z-50 px-4 py-3 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          <SearchInput className="w-full" />
        </div>
      )}
    </>
  )
}
