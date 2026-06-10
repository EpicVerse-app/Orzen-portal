'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Package, FolderPlus, X, Upload, Pencil } from 'lucide-react'
import {
  addProductAction,
  updateProductAction,
  deleteProductAction,
  addCategoryAction,
  deleteCategoryAction,
} from '@/app/dashboard/admin/products/actions'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  unit: string
  price: number | null
  image_url: string | null
  image_url_2: string | null
  image_url_3: string | null
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
}

// ─── Reusable 3-slot image uploader ────────────────────────────────────────
interface ImageSlotProps {
  slot: number
  preview: string | null
  inputId: string
  inputRef: React.RefObject<HTMLInputElement>
  onSelect: (slot: number, e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (slot: number) => void
}
function ImageSlot({ slot, preview, inputId, inputRef, onSelect, onRemove }: ImageSlotProps) {
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => onSelect(slot, e)}
        className="hidden"
        id={inputId}
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={`Image ${slot + 1}`}
            className="w-full aspect-square rounded-xl object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onRemove(slot)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#c9a84c] transition-colors"
        >
          <Upload className="w-4 h-4 text-gray-400 mb-1" />
          <p className="text-[10px] text-gray-400">Image {slot + 1}</p>
        </label>
      )}
    </div>
  )
}

export default function ProductManager({ profile, categories, companyId }: Props) {
  const gold         = '#c9a84c'
  const primaryColor = '#570439'

  // ── Expanded category
  const [expandedCat, setExpandedCat]       = useState<string | null>(categories[0]?.id || null)

  // ── Add product form
  const [showAddProduct, setShowAddProduct] = useState<string | null>(null)
  const [addSaving, setAddSaving]           = useState(false)
  const [addFiles, setAddFiles]             = useState<(File | null)[]>([null, null, null])
  const [addPreviews, setAddPreviews]       = useState<(string | null)[]>([null, null, null])
  const addRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // ── Edit product form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editSaving, setEditSaving]         = useState(false)
  // editImageUrls = the "current saved URL" for each slot (null = cleared)
  const [editImageUrls, setEditImageUrls]   = useState<(string | null)[]>([null, null, null])
  // editFiles = new file selected by user to replace that slot
  const [editFiles, setEditFiles]           = useState<(File | null)[]>([null, null, null])
  // editPreviews = what to show (blob URL if new file, existing URL if unchanged, null if cleared)
  const [editPreviews, setEditPreviews]     = useState<(string | null)[]>([null, null, null])
  const editRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // ── Add category
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [catSaving, setCatSaving]             = useState(false)

  // ── Deleting
  const [deleting, setDeleting] = useState<string | null>(null)

  // ───────────── Image upload helper ──────────────────────────────────────
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

  // ───────────── ADD product ───────────────────────────────────────────────
  function handleAddImageSelect(slot: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAddFiles(prev => { const n = [...prev]; n[slot] = file; return n })
    setAddPreviews(prev => { const n = [...prev]; n[slot] = URL.createObjectURL(file); return n })
  }
  function handleAddImageRemove(slot: number) {
    setAddFiles(prev => { const n = [...prev]; n[slot] = null; return n })
    setAddPreviews(prev => { const n = [...prev]; n[slot] = null; return n })
    const ref = addRefs[slot]; if (ref.current) ref.current.value = ''
  }
  function resetAddState() {
    setAddFiles([null, null, null]); setAddPreviews([null, null, null])
    addRefs.forEach(r => { if (r.current) r.current.value = '' })
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>, categoryId: string) {
    e.preventDefault()
    setAddSaving(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('category_id', categoryId)
    fd.set('company_id', companyId)

    const urlKeys = ['image_url', 'image_url_2', 'image_url_3']
    for (let i = 0; i < 3; i++) {
      if (addFiles[i]) {
        const url = await uploadImage(addFiles[i]!, i)
        if (!url) { setAddSaving(false); return }
        fd.set(urlKeys[i], url)
      }
    }

    const result = await addProductAction(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Product added')
      form.reset(); resetAddState(); setShowAddProduct(null)
    }
    setAddSaving(false)
  }

  // ───────────── EDIT product ───────────────────────────────────────────────
  function openEdit(product: Product) {
    setEditingProduct(product)
    const urls = [product.image_url, product.image_url_2, product.image_url_3]
    setEditImageUrls(urls)
    setEditFiles([null, null, null])
    setEditPreviews(urls)
    editRefs.forEach(r => { if (r.current) r.current.value = '' })
    // Close add-product panel if open
    setShowAddProduct(null)
  }
  function closeEdit() {
    setEditingProduct(null)
    setEditFiles([null, null, null]); setEditPreviews([null, null, null]); setEditImageUrls([null, null, null])
    editRefs.forEach(r => { if (r.current) r.current.value = '' })
  }

  function handleEditImageSelect(slot: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditFiles(prev => { const n = [...prev]; n[slot] = file; return n })
    setEditPreviews(prev => { const n = [...prev]; n[slot] = URL.createObjectURL(file); return n })
  }
  function handleEditImageRemove(slot: number) {
    setEditFiles(prev => { const n = [...prev]; n[slot] = null; return n })
    setEditPreviews(prev => { const n = [...prev]; n[slot] = null; return n })
    setEditImageUrls(prev => { const n = [...prev]; n[slot] = null; return n })
    const ref = editRefs[slot]; if (ref.current) ref.current.value = ''
  }

  async function handleEditProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingProduct) return
    setEditSaving(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('product_id', editingProduct.id)

    // For each slot: if new file → upload; else keep existing URL (may be null)
    const urlKeys = ['image_url', 'image_url_2', 'image_url_3']
    for (let i = 0; i < 3; i++) {
      if (editFiles[i]) {
        const url = await uploadImage(editFiles[i]!, i)
        if (!url) { setEditSaving(false); return }
        fd.set(urlKeys[i], url)
      } else {
        // keep existing or cleared (null → empty string means null in action)
        fd.set(urlKeys[i], editImageUrls[i] || '')
      }
    }

    const result = await updateProductAction(fd)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Product updated')
      closeEdit()
    }
    setEditSaving(false)
  }

  // ───────────── DELETE product ─────────────────────────────────────────────
  async function handleDeleteProduct(productId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(productId)
    const result = await deleteProductAction(productId)
    if (result?.error) toast.error(result.error)
    else toast.success('Product deleted')
    setDeleting(null)
  }

  // ───────────── Category actions ───────────────────────────────────────────
  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCatSaving(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('company_id', companyId)
    const result = await addCategoryAction(fd)
    if (result?.error) toast.error(result.error)
    else { toast.success('Category added'); form.reset(); setShowAddCategory(false) }
    setCatSaving(false)
  }

  async function handleDeleteCategory(categoryId: string, name: string, productCount: number) {
    if (productCount > 0) { toast.error(`Delete all ${productCount} products in "${name}" first.`); return }
    if (!confirm(`Delete category "${name}"?`)) return
    setDeleting(categoryId)
    const result = await deleteCategoryAction(categoryId)
    if (result?.error) toast.error(result.error)
    else toast.success('Category deleted')
    setDeleting(null)
  }

  // ─────────────────────── Render ──────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Product Catalogue</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {categories.length} categories · {categories.reduce((s, c) => s + c.products.length, 0)} products
            </p>
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
                    <Package className="w-4 h-4" style={{ color: gold }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.products.length} products</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name, cat.products.length) }}
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
                      {cat.products.map((product) =>
                        editingProduct?.id === product.id ? (
                          /* ── Inline edit form ── */
                          <form
                            key={product.id}
                            onSubmit={handleEditProduct}
                            className="px-5 py-4 space-y-3 bg-amber-50/40 border-l-4 border-[#c9a84c]"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Edit Product</p>
                              <button type="button" onClick={closeEdit}>
                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              </button>
                            </div>

                            <input
                              name="name"
                              required
                              defaultValue={product.name}
                              placeholder="Product name"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] bg-white"
                            />
                            <input
                              name="unit"
                              required
                              defaultValue={product.unit}
                              placeholder="Unit (e.g. pcs, kg)"
                              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] bg-white"
                            />
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₹</span>
                              <input
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={product.price ?? ''}
                                placeholder="Price (optional)"
                                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c] bg-white"
                              />
                            </div>

                            {/* Image slots */}
                            <div>
                              <p className="text-xs text-gray-400 mb-2">Product Images — click to replace, × to remove</p>
                              <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map((slot) => (
                                  <ImageSlot
                                    key={slot}
                                    slot={slot}
                                    preview={editPreviews[slot]}
                                    inputId={`edit-image-${product.id}-${slot}`}
                                    inputRef={editRefs[slot]}
                                    onSelect={handleEditImageSelect}
                                    onRemove={handleEditImageRemove}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={closeEdit}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={editSaving}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-40 transition-opacity hover:opacity-80"
                                style={{ backgroundColor: gold }}
                              >
                                {editSaving ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* ── Normal product row ── */
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
                            {/* Price */}
                            <p className="text-sm font-semibold shrink-0" style={{ color: primaryColor }}>
                              {product.price != null && product.price > 0 ? `₹${product.price.toFixed(2)}` : '—'}
                            </p>
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(product)}
                              className="p-1.5 text-gray-300 hover:text-[#c9a84c] transition-colors shrink-0"
                              title="Edit product"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={deleting === product.id}
                              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Add product */}
                  {showAddProduct === cat.id ? (
                    <form
                      onSubmit={(e) => handleAddProduct(e, cat.id)}
                      className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">New Product</p>
                        <button type="button" onClick={() => { setShowAddProduct(null); resetAddState() }}>
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
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₹</span>
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price (optional)"
                          className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 mb-2">Product Images — up to 3 angles (optional)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[0, 1, 2].map((slot) => (
                            <ImageSlot
                              key={slot}
                              slot={slot}
                              preview={addPreviews[slot]}
                              inputId={`add-image-${cat.id}-${slot}`}
                              inputRef={addRefs[slot]}
                              onSelect={handleAddImageSelect}
                              onRemove={handleAddImageRemove}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={addSaving}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-black disabled:opacity-40 transition-opacity hover:opacity-80"
                        style={{ backgroundColor: gold }}
                      >
                        {addSaving ? 'Adding...' : 'Add Product'}
                      </button>
                    </form>
                  ) : (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <button
                        onClick={() => { setShowAddProduct(cat.id); closeEdit() }}
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
                disabled={catSaving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-black disabled:opacity-40"
                style={{ backgroundColor: gold }}
              >
                {catSaving ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
