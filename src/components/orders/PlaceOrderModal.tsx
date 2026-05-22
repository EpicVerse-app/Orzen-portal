'use client'

import { useEffect, useState } from 'react'
import { X, ShoppingCart, Plus, Minus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category, CartItem } from '@/types'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Props {
  companyId: string
  branchId: string
  userId: string
  onClose: () => void
}

export default function PlaceOrderModal({ companyId, branchId, userId, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [view, setView] = useState<'browse' | 'cart'>('browse')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name')
      setCategories(data || [])
    }
    loadCategories()
  }, [companyId])

  useEffect(() => {
    if (!selectedCategory) return
    async function loadProducts() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(id, name)')
        .eq('company_id', companyId)
        .eq('category_id', selectedCategory)
        .order('name')
      setProducts(data || [])
      setLoading(false)
    }
    loadProducts()
  }, [selectedCategory, companyId])

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    )
  }

  function getQty(productId: string) {
    return cart.find((c) => c.product.id === productId)?.quantity || 0
  }

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0)

  async function submitOrder() {
    if (cart.length === 0) return
    setSubmitting(true)

    const supabase = createClient()
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        company_id: companyId,
        branch_id: branchId,
        created_by: userId,
        status: 'submitted',
        escalation_deadline: deadline.toISOString(),
      })
      .select('id')
      .single()

    if (error || !order) {
      toast.error('Failed to place order. Try again.')
      setSubmitting(false)
      return
    }

    const items = cart.map((c) => ({
      order_id: order.id,
      product_id: c.product.id,
      quantity: c.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(items)

    if (itemsError) {
      toast.error('Failed to save order items.')
      setSubmitting(false)
      return
    }

    toast.success('Order placed successfully!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {view === 'browse' ? 'Place Order' : 'Review Cart'}
          </h2>
          <div className="flex items-center gap-3">
            {view === 'browse' && cart.length > 0 && (
              <button
                onClick={() => setView('cart')}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {totalItems} items
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {view === 'browse' ? (
          <div className="flex-1 overflow-y-auto">
            {/* Categories */}
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            {selectedCategory && (
              <div className="px-5 py-4">
                {loading ? (
                  <div className="text-center py-8 text-sm text-gray-400">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">No products in this category</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((product) => {
                      const qty = getQty(product.id)
                      return (
                        <div key={product.id} className="bg-gray-50 rounded-xl p-3">
                          <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2 overflow-hidden">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400 mb-2">{product.unit}</p>
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg px-2 py-1">
                              <button onClick={() => updateQty(product.id, -1)}>
                                <Minus className="w-4 h-4 text-blue-600" />
                              </button>
                              <span className="text-sm font-semibold text-blue-600">{qty}</span>
                              <button onClick={() => updateQty(product.id, 1)}>
                                <Plus className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedCategory && (
              <div className="text-center py-12 text-sm text-gray-400">
                Select a category to view products
              </div>
            )}
          </div>
        ) : (
          /* Cart View */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400">{item.product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
                    <button onClick={() => updateQty(item.product.id, -1)}>
                      <Minus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)}>
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          {view === 'cart' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total items</span>
              <span className="font-semibold text-gray-900">{totalItems}</span>
            </div>
          )}
          <div className="flex gap-3">
            {view === 'cart' && (
              <button
                onClick={() => setView('browse')}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Add More
              </button>
            )}
            <button
              onClick={view === 'browse' ? () => setView('cart') : submitOrder}
              disabled={cart.length === 0 || submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Placing...'
                : view === 'browse'
                ? `Review Cart (${totalItems})`
                : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
