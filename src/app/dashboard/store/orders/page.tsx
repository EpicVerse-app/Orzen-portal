import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Package, Calendar, MapPin } from 'lucide-react'

export default async function MyOrdersPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, escalation_deadline,
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
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    #MO-{order.id.slice(-4).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="divide-y divide-gray-50">
                {(order.items as any)?.map((item: any) => (
                  <div key={item.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{item.product?.category?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">× {item.quantity}</p>
                      <p className="text-xs text-gray-400">{item.product?.unit}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {(order.items as any)?.length} product{(order.items as any)?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                  {(order.items as any)?.reduce((s: number, i: any) => s + i.quantity, 0)} total items
                </p>
                {order.status === 'submitted' && <p className="text-xs text-orange-500 font-medium">Awaiting approval</p>}
                {order.status === 'approved'  && <p className="text-xs text-green-600 font-medium">Approved — being processed</p>}
                {order.status === 'shipped'   && <p className="text-xs text-purple-600 font-medium">On the way</p>}
                {order.status === 'delivered' && <p className="text-xs text-teal-600 font-medium">Delivered — confirm receipt</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
