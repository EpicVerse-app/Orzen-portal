import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import DeliveryReceiveButton from '@/components/orders/DeliveryReceiveButton'
import {
  Package, Calendar, MapPin, Truck, CheckCircle2,
  Clock, Image as ImageIcon, ChevronRight, History,
} from 'lucide-react'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function DeliveriesPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch   = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, updated_at,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit, category:categories(name))
      )
    `)
    .eq('branch_id', profile.branch_id)
    .in('status', ['shipped', 'delivered', 'closed'])
    .order('created_at', { ascending: false })

  const inTransit = (orders || []).filter(o => o.status === 'shipped')
  const delivered = (orders || []).filter(o => ['delivered', 'closed'].includes(o.status))

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Status</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {(branch as any)?.name} — {(branch as any)?.city}
        </div>
      </div>

      {/* ── Section 1: Delivery Status (in transit) ─── */}
      <section>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Delivery Status</h2>
            <p className="text-xs text-gray-400">Orders currently on the way to your store</p>
          </div>
          {inTransit.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              {inTransit.length} on the way
            </span>
          )}
        </div>

        {inTransit.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
              <Truck className="w-6 h-6 text-purple-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No active deliveries</p>
            <p className="text-xs text-gray-400 mt-0.5">Your orders will appear here when shipped</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inTransit.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="transit"
                companyId={(profile as any).company_id}
                branchId={(profile as any).branch_id}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Delivery History ─────────────── */}
      <section>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <History className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Delivery History</h2>
            <p className="text-xs text-gray-400">Orders successfully received at your store</p>
          </div>
          {delivered.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              {delivered.length} delivered
            </span>
          )}
        </div>

        {delivered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No delivery history yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Completed deliveries will show here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {delivered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                variant="delivered"
                companyId={(profile as any).company_id}
                branchId={(profile as any).branch_id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function OrderCard({
  order,
  variant,
  companyId,
  branchId,
}: {
  order: any
  variant: 'transit' | 'delivered'
  companyId: string
  branchId: string
}) {
  const isTransit = variant === 'transit'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isTransit ? 'border-purple-100' : 'border-gray-100'
    }`}>
      {/* Coloured top bar */}
      <div className={`h-1 w-full ${isTransit ? 'bg-purple-400' : 'bg-green-400'}`} />

      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-gray-50 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800">{shortId(order.id)}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />
              {fmtDate(order.created_at)}
            </div>
            {isTransit ? (
              <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
                <Clock className="w-3 h-3 shrink-0" />
                On the way
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {fmtDate(order.updated_at)}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0"><OrderStatusBadge status={order.status} /></div>
      </div>

      {/* Items */}
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

      {/* Photos row */}
      {(order.loaded_photo_url || order.shipped_photo_url || order.delivery_photo_url) && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
            <ImageIcon className="w-3.5 h-3.5" /> Photos
          </p>
          <div className="flex gap-2 flex-wrap">
            {order.loaded_photo_url && (
              <a href={order.loaded_photo_url} target="_blank" rel="noopener noreferrer" className="text-center">
                <img src={order.loaded_photo_url} alt="Loaded" className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80" />
                <p className="text-[10px] text-gray-400 mt-0.5">Loaded</p>
              </a>
            )}
            {order.shipped_photo_url && (
              <a href={order.shipped_photo_url} target="_blank" rel="noopener noreferrer" className="text-center">
                <img src={order.shipped_photo_url} alt="Shipped" className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80" />
                <p className="text-[10px] text-gray-400 mt-0.5">Shipped</p>
              </a>
            )}
            {order.delivery_photo_url && (
              <a href={order.delivery_photo_url} target="_blank" rel="noopener noreferrer" className="text-center">
                <img src={order.delivery_photo_url} alt="Received" className="w-16 h-16 rounded-xl object-cover border border-gray-200 hover:opacity-80" />
                <p className="text-[10px] text-gray-400 mt-0.5">Received</p>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-gray-400">
          {order.items?.length} product{order.items?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          {order.items?.reduce((s: number, i: any) => s + i.quantity, 0)} items
        </p>
        {order.status === 'shipped' && (
          <DeliveryReceiveButton
            orderId={order.id}
            companyId={companyId}
            branchId={branchId}
            shortId={shortId(order.id)}
          />
        )}
      </div>
    </div>
  )
}
