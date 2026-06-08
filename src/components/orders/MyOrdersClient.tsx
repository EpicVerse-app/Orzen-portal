'use client'

import { useState, useMemo, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import OrderAccordionCard from '@/components/orders/OrderAccordionCard'
import { Package, Image as ImageIcon, Search, X } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
}

interface Props {
  orders: any[]
  initialSearch?: string
}

export default function MyOrdersClient({ orders, initialSearch = '' }: Props) {
  const [query, setQuery] = useState(initialSearch)
  useEffect(() => { setQuery(initialSearch) }, [initialSearch])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const sid = shortId(order.id).toLowerCase()
      const productNames = (order.items as any[])
        ?.map((i: any) => i.product?.name?.toLowerCase() || '').join(' ') || ''
      return sid.includes(q) || order.id.toLowerCase().includes(q) || productNames.includes(q)
    })
  }, [orders, query])

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID or product name..."
          className="w-full pl-10 pr-9 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
        />
        <AnimatePresence>
          {query && (
            <m.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {query && (
          <m.p
            key="count"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-gray-400 mb-3"
          >
            {filtered.length === 0 ? 'No orders found' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} found`}
          </m.p>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center"
        >
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {query ? `No orders match "${query}"` : 'No orders placed yet'}
          </p>
        </m.div>
      ) : (
        <m.div
          key={query}
          variants={list}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((order: any) => (
            <m.div key={order.id} variants={item}>
              <OrderAccordionCard
                shortOrderId={shortId(order.id)}
                date={order.created_at}
                status={order.status}
                itemCount={order.items?.length || 0}
                totalQty={order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0}
              >
                <div className="divide-y divide-gray-50">
                  {order.items?.map((itm: any) => (
                    <div key={itm.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {itm.product?.image_url
                          ? <img src={itm.product.image_url} alt={itm.product.name} className="w-full h-full object-cover" />
                          : <Package className="w-4 h-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{itm.product?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{itm.product?.category?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-800">× {itm.quantity}</p>
                        <p className="text-xs text-gray-400">{itm.product?.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
                  <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                      <ImageIcon className="w-3.5 h-3.5" />Delivery Photos
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {order.loaded_photo_url && (
                        <div className="text-center">
                          <a href={order.loaded_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={order.loaded_photo_url} alt="Loaded" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 active:opacity-70 transition-opacity" />
                          </a>
                          <p className="text-[9px] text-gray-400 mt-0.5">Loaded</p>
                        </div>
                      )}
                      {order.shipped_photo_url && (
                        <div className="text-center">
                          <a href={order.shipped_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={order.shipped_photo_url} alt="Shipped" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 active:opacity-70 transition-opacity" />
                          </a>
                          <p className="text-[9px] text-gray-400 mt-0.5">Shipped</p>
                        </div>
                      )}
                      {order.delivery_photo_url && (
                        <div className="text-center">
                          <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={order.delivery_photo_url} alt="Received" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 active:opacity-70 transition-opacity" />
                          </a>
                          <p className="text-[9px] text-gray-400 mt-0.5">Received</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-50">
                  <p className="text-[10px] text-gray-300">{order.status}</p>
                </div>
              </OrderAccordionCard>
            </m.div>
          ))}
        </m.div>
      )}
    </>
  )
}
