'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Package, FolderPlus, X, Upload, ImageIcon } from 'lucide-react'
import { addProductAction, deleteProductAction, addCategoryAction, deleteCategoryAction } from '@/app/dashboard/admin/products/actions'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/ui/LogoutButton'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  unit: string
  image_url: string | null
}

interface Category {
  id: string
  name: string
  description: string | null
  products: Product[]
}

interface Props {
  profile: any
  categories: Category[]
  companyId: string
  primaryColor: string
  logoUrl: string | null
}

export default function ProductManager({ profile, categories, companyId, primaryColor, logoUrl }: Props) {
  const [expandedCat, setExpandedCat]       = useState<string | null>(categories[0]?.id || null)
  const [showAddProduct, setShowAddProduct]   = useState<string | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [deleting, setDeleting]             = useState<string | null>(null)
  const [saving, setSaving]                 = useState(false)

  // 3 image slots
  const [imageFiles, setImageFiles]     = useState<(File | null)[]>([null, null, null])
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null])
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const gold = '#c9a84c'
  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company

  function handleImageSelect(slot: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFiles(prev => { const n = [...prev]; n[slot] = file; return n })
    setImagePreviews(prev => { const n = [...prev]; n[slot] = URL.createObjectURL(file); return n })
  }

  function removeImage(slot: number) {
    setImageFiles(prev => { const n = [...prev]; n[slot] = null; return n })
    setImagePreviews(prev => { const n = [...prev]; n[slot] = null; return n })
    const ref = fileInputRefs[slot]
    if (ref.current) ref.current.value = ''
  }

  function resetImageState() {
    setImageFiles([null, null, null])
    setImagePreviews([null, null, null])
    fileInputRefs.forEach(r => { if (r.current) r.current.value = '' })
  }

  async function uploadImage(file: File, slot: number): Promise<string | null> {
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop()
      const path = `${companyId}/${Date.now()}_${slot}.${ext}`
      const { data: uploaded, error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploaded.path)
      return urlData.publicUrl
    } catch (err: any) {
      toast.error(`Image ${slot + 1} upload failed: ` + (err.message || 'Unknown error'))
      return null
    }
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>, categoryId: string) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('category_id', categoryId)
    fd.set('company_id', companyId)

    // Upload up to 3 images
    const urlKeys = ['image_url', 'image_url_2', 'image_url_3']
    for (let i = 0; i < 3; i++) {
      if (imageFiles[i]) {
        const url = await uploadImage(imageFiles[i]!, i)
        if (!url) { setSaving(false); return }
        fd.set(urlKeys[i], url)
      }
    }

    const result = await addProductAction(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Product added')
      form.reset()
      resetImageState()
      setShowAddProduct(null)
    }
    setSaving(false)
  }

  async function handleDeleteProduct(productId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(productId)
    const result = await deleteProductAction(productId)
    if (result?.error) toast.error(result.error)
    else toast.success('Product deleted')
    setDeleting(null)
  }

  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('company_id', companyId)

    const result = await addCategoryAction(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Category added')
      form.reset()
      setShowAddCategory(false)
    }
    setSaving(false)
  }

  async function handleDeleteCategory(categoryId: string, name: string, productCount: number) {
    if (productCount > 0) {
      toast.error(`Delete all ${productCount} products in "${name}" first.`)
      return
    }
    if (!confirm(`Delete category "${name}"?`)) return
    setDeleting(categoryId)
    const result = await deleteCategoryAction(categoryId)
    if (result?.error) toast.error(result.error)
    else toast.success('Category deleted')
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="h-20 flex items-center px-4 gap-3 sticky top-0 z-50"
        style={{ backgroundColor: primaryColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={company?.name} className="h-14 sm:h-16 w-auto object-contain max-w-[260px] sm:max-w-[380px]" />
        ) : (
          <p className="text-sm font-extrabold tracking-widest uppercase" style={{ color: gold }}>
            {company?.name}
          </p>
        )}
        <div className="flex-1" />
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full hidden sm:block"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          Admin
        </span>
        <Link
          href="/dashboard/super"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          ← Dashboard
        </Link>
        <LogoutButton />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Page title + Add Category button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Product Catalogue</h1>
            <p className="text-sm text-gray-500 mt-0.5">{categories.length} categories · {categories.reduce((s, c) => s + c.products.length, 0)} products</p>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-black transition-opacity hover:opacity-80"
            style={{ backgroundColor: gold }}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </div>

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No categories yet — add one above</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Category header */}
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Package className="w-4 h-4" style={{ color: gold }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.products.length} products</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(cat.id, cat.name, cat.products.length)
                    }}
                    disabled={deleting === cat.id}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedCat === cat.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </div>

              {/* Products list */}
              {expandedCat === cat.id && (
                <>
                  {cat.products.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-gray-400 border-t border-gray-50">
                      No products yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 border-t border-gray-50">
                      {cat.products.map((product) => (
                        <div key={product.id} className="px-5 py-3 flex items-center gap-3">
                          {/* Image */}
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            {product.image_url
                              ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              : <Package className="w-4 h-4 text-gray-300" />
                            }
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.unit}</p>
                          </div>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            disabled={deleting === product.id}
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add product button */}
                  {showAddProduct === cat.id ? (
                    <form
                      onSubmit={(e) => handleAddProduct(e, cat.id)}
                      className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">New Product</p>
                        <button type="button" onClick={() => setShowAddProduct(null)}>
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      <input
                        name="name"
                        required
                        placeholder="Product name"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                      />
                      <input
                        name="unit"
                        required
                        placeholder="Unit (e.g. pcs, kg)"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                      />

                      {/* Image upload — 3 slots */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Product Images — up to 3 angles (optional)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((slot) => (
                            <div key={slot}>
                              <input
                                ref={fileInputRefs[slot]}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageSelect(slot, e)}
                                className="hidden"
                                id={`product-image-${slot}`}
                              />
                              {imagePreviews[slot] ? (
                                <div className="relative">
                                  <img
                                    src={imagePreviews[slot]!}
                                    alt={`Preview ${slot + 1}`}
                                    className="w-full aspect-square rounded-xl object-cover border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(slot)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label
                                  htmlFor={`product-image-${slot}`}
                                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#c9a84c] transition-colors"
                                >
                                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                                  <p className="text-[10px] text-gray-400">Image {slot + 1}</p>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-40 transition-opacity hover:opacity-80"
                        style={{ backgroundColor: gold }}
                      >
                        {saving ? 'Adding...' : 'Add Product'}
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <button
                        onClick={() => setShowAddProduct(cat.id)}
                        className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
                        style={{ color: primaryColor }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Product
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New Category</h2>
              <button onClick={() => setShowAddCategory(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="px-6 py-5 space-y-4">
              <input
                name="name"
                required
                placeholder="Category name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
              <input
                name="description"
                placeholder="Description (optional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-black disabled:opacity-40"
                style={{ backgroundColor: gold }}
              >
                {saving ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
