import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Package, Calendar, MapPin, Truck, CheckCircle2, Clock } from 'lucide-react'

export default async function DeliveriesPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, updated_at, delivery_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit,
          category:categories(name)
        )
      )
    `)
    .eq('branch_id', profile.branch_id)
    .in('status', ['shipped', 'delivered', 'closed'])
    .order('created_at', { ascending: false })

  const inTransit = (orders || []).filter(o => o.status === 'shipped')
  const delivered = (orders || []).filter(o => ['delivered', 'closed'].includes(o.status))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{(branch as any)?.name} — {(branch as any)?.city}</span>
        </div>
      </div>

      {inTransit.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              In Transit ({inTransit.length})
            </h2>
          </div>
          <div className="space-y-3">
            {inTransit.map((order) => <OrderCard key={order.id} order={order} showDeliveredDate={false} />)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Delivery History ({delivered.length})
          </h2>
        </div>

        {delivered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No deliveries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {delivered.map((order) => <OrderCard key={order.id} order={order} showDeliveredDate={true} />)}
          </div>
        )}
      </div>
    </>
  )
}

function OrderCard({ order, showDeliveredDate }: { order: any; showDeliveredDate: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">#MO-{order.id.slice(-4).toUpperCase()}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              Ordered: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {showDeliveredDate ? (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Delivered: {new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-purple-500 font-medium">
                <Clock className="w-3 h-3" />
                On the way
              </div>
            )}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="divide-y divide-gray-50">
        {order.items?.map((item: any) => (
          <div key={item.id} className="px-6 py-3 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {item.product?.image_url
                ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                : <Package className="w-5 h-5 text-gray-300" />}
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
          {order.items?.length} product{order.items?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          {order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} total items
        </p>
        {order.delivery_photo_url && (
          <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-600 font-medium">
            View delivery photo →
          </a>
        )}
      </div>
    </div>
  )
}
