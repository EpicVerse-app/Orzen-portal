import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Package, Calendar, MapPin, CheckCircle2, Image as ImageIcon, History } from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DeliveryHistoryPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch   = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, updated_at,
      delivery_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit, category:categories(name))
      )
    `)
    .eq('branch_id', profile.branch_id)
    .in('status', ['delivered', 'closed'])
    .order('created_at', { ascending: false })

  const delivered = orders || []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {(branch as any)?.name} — {(branch as any)?.city}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
          <History className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-800">Received Orders</h2>
          <p className="text-xs text-gray-400">All orders successfully delivered to your store</p>
        </div>
        {delivered.length > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
            {delivered.length} delivered
          </span>
        )}
      </div>

      {delivered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-14 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-green-200" />
          </div>
          <p className="text-sm font-medium text-gray-500">No delivery history yet</p>
          <p className="text-xs text-gray-400 mt-1">Completed deliveries will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {delivered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-green-400" />
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-50 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800">{shortId(order.id)}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />{fmtDate(order.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />{fmtDate(order.updated_at)}
                    </span>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image_url
                        ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                        : <Package className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{item.product?.category?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-700">×{item.quantity}</p>
                      <p className="text-xs text-gray-400">{item.product?.unit}</p>
                    </div>
                  </div>
                ))}
              </div>

              {order.delivery_photo_url && (
                <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-2"><ImageIcon className="w-3.5 h-3.5" />Received Photo</p>
                  <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={order.delivery_photo_url} alt="Received" className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80" />
                  </a>
                </div>
              )}

              <div className="px-4 sm:px-5 py-3 bg-gray-50/70 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {order.items?.length} product{order.items?.length !== 1 ? 's' : ''} · {order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} items
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
