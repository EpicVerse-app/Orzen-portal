import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Image as ImageIcon, Truck } from 'lucide-react'
import Link from 'next/link'
import OrderAccordionCard from '@/components/orders/OrderAccordionCard'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default async function StoreHeadDeliveriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, branch_id, branch:branches(name, city)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_head') redirect('/dashboard')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, loaded_photo_url, shipped_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit, category:categories(name))
      )
    `)
    .eq('branch_id', profile.branch_id)
    .eq('status', 'shipped')
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {branch?.name} — orders in transit
        </p>
      </div>

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No active deliveries</p>
          <p className="text-xs text-gray-300 mt-1">Orders appear here once shipped by the vendor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order: any) => (
            <OrderAccordionCard
              key={order.id}
              shortOrderId={shortId(order.id)}
              date={order.created_at}
              status={order.status}
              itemCount={order.items?.length || 0}
              totalQty={order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0}
              detailHref={`/dashboard/store-head/orders/${order.id}`}
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
                      <p className="text-xs text-gray-400">{itm.product?.category?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">× {itm.quantity}</p>
                      <p className="text-xs text-gray-400">{itm.product?.unit}</p>
                    </div>
                  </div>
                ))}
              </div>

              {(order.loaded_photo_url || order.shipped_photo_url) && (
                <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                    <ImageIcon className="w-3.5 h-3.5" /> Delivery Photos
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {order.loaded_photo_url && (
                      <div className="text-center">
                        <a href={order.loaded_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={order.loaded_photo_url} alt="Loaded" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                        <p className="text-[9px] text-gray-400 mt-0.5">Loaded</p>
                      </div>
                    )}
                    {order.shipped_photo_url && (
                      <div className="text-center">
                        <a href={order.shipped_photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={order.shipped_photo_url} alt="Shipped" className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                        <p className="text-[9px] text-gray-400 mt-0.5">Shipped</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </OrderAccordionCard>
          ))}
        </div>
      )}
    </div>
  )
}
