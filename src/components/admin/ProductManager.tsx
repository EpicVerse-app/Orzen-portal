'use client'

import { useState, useTransition, useRef } from 'react'
import { addProductAction, deleteProductAction, addCategoryAction, deleteCategoryAction } from '@/app/dashboard/admin/actions'
import { Plus, Trash2, Package, FolderOpen, Loader2, ChevronRight, X } from 'lucide-react'

interface Category { id: string; name: string; description?: string | null }
interface Product  { id: string; name: string; unit: string; category_id: string }

interface Props {
  categories:  Category[]
  products:    Product[]
  companyId:   string
  companyName: string
}

const gold    = '#c9a84c'
const primary = '#5B2D8E'

export default function ProductManager({ categories: initCats, products: initProds, companyId, companyName }: Props) {
  const [categories, setCategories] = useState(initCats)
  const [products,   setProducts]   = useState(initProds)
  const [activeCat,  setActiveCat]  = useState<string>(initCats[0]?.id ?? '')
  const [showAddCat, setShowAddCat] = useState(false)
  const [error,      setError]      = useState('')
  const [isPending,  startTransition] = useTransition()

  const addProdRef = useRef<HTMLFormElement>(null)
  const addCatRef  = useRef<HTMLFormElement>(null)

  const catProducts = products.filter(p => p.category_id === activeCat)
  const activeCatName = categories.find(c => c.id === activeCat)?.name ?? ''

  /* ── Add product ─────────────────────────── */
  function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('company_id', companyId)
    fd.set('category_id', activeCat)

    startTransition(async () => {
      const res = await addProductAction(fd)
      if (res?.error) { setError(res.error); return }
      // Optimistic update
      setProducts(prev => [...prev, {
        id: crypto.randomUUID(),
        name: fd.get('name') as string,
        unit: fd.get('unit') as string,
        category_id: activeCat,
      }])
      addProdRef.current?.reset()
    })
  }

  /* ── Delete product ──────────────────────── */
  function handleDeleteProduct(productId: string) {
    setProducts(prev => prev.filter(p => p.id !== productId))
    startTransition(() => deleteProductAction(productId))
  }

  /* ── Add category ────────────────────────── */
  function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('company_id', companyId)

    startTransition(async () => {
      const res = await addCategoryAction(fd)
      if (res?.error) { setError(res.error); return }
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: fd.get('name') as string,
        description: fd.get('description') as string || null,
      }
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
      setActiveCat(newCat.id)
      setShowAddCat(false)
      addCatRef.current?.reset()
    })
  }

  /* ── Delete category ─────────────────────── */
  function handleDeleteCategory(catId: string) {
    setCategories(prev => prev.filter(c => c.id !== catId))
    setProducts(prev => prev.filter(p => p.category_id !== catId))
    if (activeCat === catId) setActiveCat(categories.find(c => c.id !== catId)?.id ?? '')
    startTransition(() => deleteCategoryAction(catId))
  }

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{companyName}</p>
          <h1 className="text-xl font-bold text-gray-900">Product Manager</h1>
        </div>
        <a href="/dashboard/store" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back to Dashboard
        </a>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-0 h-[calc(100vh-73px)]">

        {/* ── Left: Category list ───────────────────── */}
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: gold }}>
              Categories
            </p>
            <button
              onClick={() => setShowAddCat(true)}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: primary }}
              title="Add category"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Add category form */}
          {showAddCat && (
            <form ref={addCatRef} onSubmit={handleAddCategory} className="px-3 py-3 border-b border-gray-100 bg-gray-50 space-y-2">
              <input
                name="name"
                required
                placeholder="Category name"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#c9a84c]"
              />
              <input
                name="description"
                placeholder="Description (optional)"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#c9a84c]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  {isPending ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Category list */}
          <div className="flex-1 overflow-y-auto py-2">
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No categories yet</p>
            ) : (
              categories.map((cat) => {
                const count  = products.filter(p => p.category_id === cat.id).length
                const active = activeCat === cat.id
                return (
                  <div key={cat.id} className="relative group">
                    <button
                      onClick={() => setActiveCat(cat.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={active
                        ? { backgroundColor: `${primary}15`, borderLeft: `3px solid ${gold}` }
                        : { borderLeft: '3px solid transparent' }
                      }
                    >
                      <FolderOpen className="w-4 h-4 shrink-0" style={{ color: active ? primary : '#9ca3af' }} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${active ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                          {cat.name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{count}</span>
                    </button>
                    {/* Delete category on hover */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${cat.name}" and all its products?`)) handleDeleteCategory(cat.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md bg-red-50 flex items-center justify-center hover:bg-red-100"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ── Right: Products panel ─────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {activeCat ? (
            <>
              {/* Add product form */}
              <div className="bg-white border-b border-gray-100 px-6 py-4">
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: gold }}>
                  Add Product to "{activeCatName}"
                </p>
                <form ref={addProdRef} onSubmit={handleAddProduct} className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-500 font-medium block mb-1">Product Name *</label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Ring Stand Velvet"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                    />
                  </div>
                  <div className="w-36">
                    <label className="text-xs text-gray-500 font-medium block mb-1">Unit *</label>
                    <input
                      name="unit"
                      required
                      placeholder="e.g. piece, box"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
                    style={{ backgroundColor: primary }}
                  >
                    {isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Plus className="w-4 h-4" />
                    }
                    Add Product
                  </button>
                </form>
              </div>

              {/* Product list */}
              <div className="flex-1 overflow-y-auto p-6">
                {catProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Package className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400 font-medium">No products yet</p>
                    <p className="text-xs text-gray-300 mt-1">Use the form above to add the first product</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {catProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between group hover:shadow-md transition-shadow"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">per {product.unit}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="ml-3 w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Select a category on the left to manage products</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
