'use client'

import OrderAccordionCard from '@/components/orders/OrderAccordionCard'
import DeliveryReceiveButton from '@/components/orders/DeliveryReceiveButton'
import { Package, Image as ImageIcon } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

interface Props {
  orders: any[]
  companyId: string
  branchId: string
}

export default function DeliveryStatusClient({ orders, companyId, branchId }: Props) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
        <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No active deliveries</p>
        <p className="text-xs text-gray-300 mt-1">Orders will appear here once shipped by the vendor</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order: any) => (
        <OrderAccordionCard
          key={order.id}
          shortOrderId={shortId(order.id)}
          date={order.created_at}
          status={order.status}
          itemCount={order.items?.length || 0}
          totalQty={order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0}
        >
          {/* Product list */}
          <div className="divide-y divide-gray-50">
            {order.items?.map((item: any) => (
              <div key={item.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {item.product?.image_url
                    ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    : <Package className="w-4 h-4 text-gray-300" />}
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

          {/* Photos */}
          {(order.loaded_photo_url || order.shipped_photo_url) && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                <ImageIcon className="w-3.5 h-3.5" />Delivery Photos
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
              </div>
            </div>
          )}

          {/* Receive button */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-50 flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-300">{order.status}</p>
            <DeliveryReceiveButton
              orderId={order.id}
              companyId={companyId}
              branchId={branchId}
              shortId={shortId(order.id)}
            />
          </div>
        </OrderAccordionCard>
      ))}
    </div>
  )
}
