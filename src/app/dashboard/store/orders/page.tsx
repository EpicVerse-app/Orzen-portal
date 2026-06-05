import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import DeliveryReceiveButton from '@/components/orders/DeliveryReceiveButton'
import { Package, Calendar, MapPin, Image as ImageIcon } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default async function MyOrdersPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, escalation_deadline,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit,
          category:categories(name)
        )
      )
    `)
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{(branch as any)?.name} — {(branch as any)?.city}</span>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders placed yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
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
                {(order.items as any)?.map((item: any) => (
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
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-50 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-gray-400">
                  {(order.items as any)?.length} product{(order.items as any)?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                  {(order.items as any)?.reduce((s: number, i: any) => s + i.quantity, 0)} items
                </p>

                {/* Upload received photo when status = shipped */}
                {order.status === 'shipped' && (
                  <DeliveryReceiveButton
                    orderId={order.id}
                    companyId={(profile as any).company_id}
                    branchId={(profile as any).branch_id}
                    shortId={shortId(order.id)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
