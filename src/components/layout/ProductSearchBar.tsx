'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Search, X, Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  image_url: string | null
  unit: string
  category_id: string | null
  category: { name: string } | null
}

interface Props {
  companyId: string
  placeholder?: string
}

export default function ProductSearchBar({ companyId, placeholder = 'Search products to order...' }: Props) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<Product[]>([])
  const [loading, setLoading]       = useState(false)
  const [open, setOpen]             = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const inputRef    = useRef<HTMLInputElement>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { addItem, items } = useCartStore()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url, unit, category_id, category:categories(name)')
      .eq('company_id', companyId)
      .ilike('name', `%${q.trim()}%`)
      .order('name')
      .limit(10)
    setResults((data as any) || [])
    setOpen(true)
    setLoading(false)
  }, [companyId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 280)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const getQty = (id: string) => quantities[id] ?? 1
  function setQty(id: string, val: number) {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }))
  }

  function handleAdd(product: Product) {
    addItem(
      { id: product.id, name: product.name, image_url: product.image_url, unit: product.unit, categoryName: (product.category as any)?.name || '' },
      getQty(product.id),
    )
    toast.success(`${product.name} added`, { duration: 1600 })
  }

  const isInCart = (id: string) => items.some(i => i.product.id === id)

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 h-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.22)' }}
      >
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent text-sm text-white placeholder-gray-400 outline-none w-full"
        />
        {loading && <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-gray-300 rounded-full animate-spin shrink-0" />}
        <AnimatePresence>
          {query && !loading && (
            <m.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={clearSearch}
              className="shrink-0 p-1"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-12 left-0 w-full min-w-[300px] max-w-[440px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {results.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No products found for "{query}"</p>
              </div>
            ) : (
              <>
                <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {results.map((product, i) => {
                    const inCart = isInCart(product.id)
                    const qty    = getQty(product.id)
                    return (
                      <m.div
                        key={product.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="flex items-center gap-2 px-3 sm:px-4 py-3 hover:bg-gray-50/80 active:bg-gray-100 transition-colors"
                      >
                        {/* Product link */}
                        <Link
                          href={product.category_id ? `/dashboard/store/catalogue/${product.category_id}` : '/dashboard/store/catalogue'}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 flex-1 min-w-0 group"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center group-hover:opacity-80 transition-opacity">
                            {product.image_url
                              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:underline">{product.name}</p>
                            <p className="text-xs text-gray-400">{(product.category as any)?.name} · {product.unit}</p>
                          </div>
                        </Link>

                        {/* Qty + Add */}
                        <div className="flex items-center gap-1 shrink-0">
                          <m.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setQty(product.id, qty - 1)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-gray-500" />
                          </m.button>
                          <span className="text-sm font-bold text-gray-700 w-7 text-center">{qty}</span>
                          <m.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setQty(product.id, qty + 1)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-gray-500" />
                          </m.button>
                          <m.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => handleAdd(product)}
                            className={`ml-1 px-3 py-2 rounded-lg text-xs font-bold transition-colors min-w-[52px] ${
                              inCart
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-600'
                            }`}
                          >
                            {inCart ? '✓' : 'Add'}
                          </m.button>
                        </div>
                      </m.div>
                    )
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{results.length} found</p>
                  <Link
                    href="/dashboard/store/view-order"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors py-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />View Cart
                  </Link>
                </div>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
