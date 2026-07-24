'use client'

import { useState } from 'react'
import { ChevronDown, Package } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

interface Item {
  id: string
  quantity: number
  product?: {
    id?: string
    name?: string
    unit?: string
    image_url?: string | null
    category?: { name: string } | null
  } | null
}

interface Props {
  items: Item[]
  baseOrderNumber?: string | null
}

function catCode(name: string) {
  return name.toUpperCase().replace(/\s+/g, '_')
}

export default function CategoryGroupedItems({ items, baseOrderNumber }: Props) {
  const categoryMap = new Map<string, Item[]>()
  for (const item of items) {
    const cat = item.product?.category?.name ?? 'Uncategorized'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(item)
  }

  const categories = Array.from(categoryMap.entries())
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  function toggle(cat: string) {
    setOpenCats(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  return (
    <div className="divide-y divide-gray-50">
      {categories.map(([cat, catItems]) => {
        const isOpen   = openCats.has(cat)
        const totalQty = catItems.reduce((s, i) => s + i.quantity, 0)
        const subId    = baseOrderNumber ? `${baseOrderNumber}_${catCode(cat)}` : null

        return (
          <div key={cat}>
            {/* Category header row */}
            <button
              onClick={() => toggle(cat)}
              className="w-full px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{cat}</span>
                  {subId && (
                    <span className="text-[10px] font-bold text-[#570439] bg-[#570439]/5 border border-[#570439]/15 px-2 py-0.5 rounded-full tracking-widest font-mono">
                      {subId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {catItems.length} product{catItems.length !== 1 ? 's' : ''} · {totalQty} items
                </p>
              </div>
              <m.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-gray-400"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </m.div>
            </button>

            {/* Items under this category */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  key={`items-${cat}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="bg-gray-50/60 divide-y divide-gray-100 border-t border-gray-100">
                    {catItems.map(item => (
                      <div key={item.id} className="px-5 sm:px-7 py-2.5 flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                          {item.product?.image_url
                            ? <img src={item.product.image_url} alt={item.product.name ?? ''} className="w-full h-full object-cover" />
                            : <Package className="w-4 h-4 text-gray-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name ?? 'Unknown'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-800">×{item.quantity}</p>
                          <p className="text-[11px] text-gray-400">{item.product?.unit ?? ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
