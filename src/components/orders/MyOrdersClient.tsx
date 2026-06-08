'use client'

import { useState, useMemo } from 'react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Package, Calendar, Image as ImageIcon, Search, X } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

interface Props {
  orders: any[]
  initialSearch?: string
}

export default function MyOrdersClient({ orders, initialSearch = '' }: Props) {
  const [query, setQuery] = useState(initialSearch)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const sid = shortId(order.id).toLowerCase()
      const rawId = order.id.toLowerCase()
      const productNames = (order.items as any[])
        ?.map((i: any) => i.product?.name?.toLowerCase() || '')
        .join(' ') || ''
      return sid.includes(q) || rawId.includes(q) || productNames.includes(q)
    })
  }, [orders, query])

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order ID or product name..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {query && (
        <p className="text-xs text-gray-400 mb-3">
          {filtered.length === 0
            ? 'No orders found'
            : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {query ? `No orders match "${query}"` : 'No orders placed yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order: any) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800">{shortId(order.id)}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="shrink-0"><OrderStatusBadge status={order.status} /></div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{item.product?.category?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">× {item.quantity}</p>
                      <p className="text-xs text-gray-400">{item.product?.unit}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photos row */}
              {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
                <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Delivery Photos
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {order.loaded_photo_url && (
                      <div className="text-center">
                        <a href={order.loaded_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={order.loaded_photo_url} alt="Loaded" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
                        </a>
                        <p className="text-[9px] text-gray-400 mt-0.5">Loaded</p>
                      </div>
                    )}
                    {order.shipped_photo_url && (
                      <div className="text-center">
                        <a href={order.shipped_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={order.shipped_photo_url} alt="Shipped" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
                        </a>
                        <p className="text-[9px] text-gray-400 mt-0.5">Shipped</p>
                      </div>
                    )}
                    {order.delivery_photo_url && (
                      <div className="text-center">
                        <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={order.delivery_photo_url} alt="Received" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
                        </a>
                        <p className="text-[9px] text-gray-400 mt-0.5">Received</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-50">
                <p className="text-xs text-gray-400">
                  {order.items?.length} product{order.items?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                  {order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} items
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
