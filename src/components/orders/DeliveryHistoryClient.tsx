'use client'

import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import OrderAccordionCard from '@/components/orders/OrderAccordionCard'
import { Package, Image as ImageIcon } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
}

interface Props { orders: any[] }

export default function DeliveryHistoryClient({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center"
      >
        <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No delivery history yet</p>
        <p className="text-xs text-gray-300 mt-1">Completed deliveries will appear here</p>
      </m.div>
    )
  }

  return (
    <m.div variants={list} initial="hidden" animate="show" className="space-y-3">
      {orders.map((order: any) => (
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
  )
}
