'use client'

import { useState, useTransition } from 'react'
import { updateImageUrlAction } from '@/app/dashboard/admin/images/actions'
import { Check, Loader2, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'

interface Category { id: string; name: string }
interface Product  { id: string; name: string; unit: string; image_url: string | null; category_id: string }

interface Props {
  categories: Category[]
  products:   Product[]
}

const gold    = '#c9a84c'
const primary = '#5B2D8E'

export default function ImageEditor({ categories, products }: Props) {
  const [urls, setUrls]           = useState<Record<string, string>>(
    Object.fromEntries(products.map(p => [p.id, p.image_url || '']))
  )
  const [saved,  setSaved]        = useState<Record<string, boolean>>({})
  const [openCat, setOpenCat]     = useState<string>(categories[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [savingId, setSavingId]   = useState<string | null>(null)

  function handleSave(productId: string) {
    setSavingId(productId)
    startTransition(async () => {
      await updateImageUrlAction(productId, urls[productId] || '')
      setSaved(prev => ({ ...prev, [productId]: true }))
      setSavingId(null)
      setTimeout(() => setSaved(prev => ({ ...prev, [productId]: false })), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Image Manager</h1>
          <p className="text-sm text-gray-400 mt-0.5">Paste an image URL next to each product and click Save</p>
        </div>
        <a href="/dashboard/store" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back to Dashboard
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {categories.map((cat) => {
          const catProducts = products.filter(p => p.category_id === cat.id)
          const withImage   = catProducts.filter(p => urls[p.id]).length
          const isOpen      = openCat === cat.id

          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Category header — click to expand */}
              <button
                onClick={() => setOpenCat(isOpen ? '' : cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary }}>
                    <ImageIcon className="w-4 h-4" style={{ color: gold }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">{withImage} / {catProducts.length} images added</p>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </button>

              {/* Product rows */}
              {isOpen && (
                <div className="divide-y divide-gray-50">
                  {catProducts.map((product) => (
                    <div key={product.id} className="px-5 py-3 flex items-center gap-4">

                      {/* Product image preview */}
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {urls[product.id] ? (
                          <img
                            src={urls[product.id]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>

                      {/* Product name */}
                      <div className="w-44 shrink-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">per {product.unit}</p>
                      </div>

                      {/* URL input */}
                      <input
                        type="url"
                        value={urls[product.id] || ''}
                        onChange={(e) => setUrls(prev => ({ ...prev, [product.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(product.id)}
                        placeholder="Paste image URL here..."
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] min-w-0"
                      />

                      {/* Save button */}
                      <button
                        onClick={() => handleSave(product.id)}
                        disabled={savingId === product.id}
                        className="shrink-0 w-20 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white transition-all"
                        style={{ backgroundColor: saved[product.id] ? '#16a34a' : primary }}
                      >
                        {savingId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : saved[product.id] ? (
                          <><Check className="w-3.5 h-3.5" /> Saved</>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
