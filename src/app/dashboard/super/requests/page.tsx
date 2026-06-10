import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Clock } from 'lucide-react'
import OrderAccordionCard from '@/components/orders/OrderAccordionCard'
import ImageCarousel from '@/components/ui/ImageCarousel'

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default async function SuperRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, scope_state')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const scopeState = (profile as any).scope_state as string | null

  // Scope to this super manager's state
  let branchQuery = supabase.from('branches').select('id').eq('company_id', profile.company_id)
  if (scopeState) branchQuery = branchQuery.eq('state', scopeState)
  const { data: scopedBranches } = await branchQuery
  const branchIds = (scopedBranches || []).map(b => b.id)

  let ordersQuery = supabase
    .from('orders')
    .select(`
      id, status, created_at,
      branch:branches(id, name, city, state),
      items:order_items(id, quantity, product:products(id, name, unit, image_url, image_url_2, image_url_3))
    `)
    .eq('company_id', profile.company_id)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  if (branchIds.length > 0) ordersQuery = ordersQuery.in('branch_id', branchIds)

  const { data: orders } = branchIds.length === 0 ? { data: [] } : await ordersQuery

  const allOrders = orders || []

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {allOrders.length === 0
              ? 'No pending orders across your region'
              : `${allOrders.length} order${allOrders.length !== 1 ? 's' : ''} awaiting Store Head approval`}
          </p>
        </div>
        {allOrders.length > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-600">
            {allOrders.length} pending
          </span>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700">
          These orders are pending approval by the Store Head. This is a monitoring view — approvals happen at store level.
        </p>
      </div>

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-semibold text-gray-600">All clear</p>
          <p className="text-sm text-gray-400 mt-1">No orders are pending approval in your region</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order: any) => (
            <OrderAccordionCard
              key={order.id}
              shortOrderId={shortId(order.id)}
              branchName={order.branch?.name}
              branchCity={order.branch?.city}
              date={order.created_at}
              status={order.status}
              itemCount={order.items?.length || 0}
              totalQty={order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0}
              detailHref={`/dashboard/super/orders/${order.id}`}
            >
              <div className="divide-y divide-gray-50">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <ImageCarousel
                      images={[item.product?.image_url, item.product?.image_url_2, item.product?.image_url_3]}
                      alt={item.product?.name || ''}
                      className="w-10 h-10 rounded-lg shrink-0"
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{item.product?.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 shrink-0">
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </OrderAccordionCard>
          ))}
        </div>
      )}
    </div>
  )
}
