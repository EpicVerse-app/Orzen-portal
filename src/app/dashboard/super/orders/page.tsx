import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Package, Image as ImageIcon } from 'lucide-react'
import OrderAccordionCard from '@/components/orders/OrderAccordionCard'

const FILTERS: Record<string, { label: string; statuses: string[] }> = {
  all:      { label: 'All Orders', statuses: ['submitted','approved','rejected','packing','loaded','shipped','delivered','closed'] },
  pending:  { label: 'Pending',    statuses: ['submitted'] },
  approved: { label: 'Approved',   statuses: ['approved','packing','loaded','shipped','delivered'] },
  rejected: { label: 'Rejected',   statuses: ['rejected'] },
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

export default async function SuperOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const activeFilter = FILTERS[filter] ? filter : 'all'
  const { statuses } = FILTERS[activeFilter]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      branch:branches(id, name, city, state),
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit, category:categories(name))
      )
    `)
    .eq('company_id', profile.company_id)
    .in('status', statuses)
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      <Link
        href="/dashboard/super"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Orders</h1>
      <p className="text-sm text-gray-400 mb-5">{allOrders.length} {FILTERS[activeFilter].label.toLowerCase()}</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Object.entries(FILTERS).map(([key, val]) => (
          <Link
            key={key}
            href={key === 'all' ? '/dashboard/super/orders' : `/dashboard/super/orders?filter=${key}`}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {val.label}
          </Link>
        ))}
      </div>

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order) => {
            const branch = order.branch as any
            return (
              <OrderAccordionCard
                key={order.id}
                shortOrderId={shortId(order.id)}
                branchName={branch?.name}
                branchCity={branch?.city}
                date={order.created_at}
                status={order.status}
                itemCount={(order.items as any)?.length || 0}
                totalQty={(order.items as any)?.reduce((s: number, i: any) => s + i.quantity, 0) || 0}
              >
                {/* Product list */}
                <div className="divide-y divide-gray-50">
                  {(order.items as any)?.map((item: any) => (
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
                {((order as any).loaded_photo_url || (order as any).shipped_photo_url || (order as any).delivery_photo_url) && (
                  <div className="px-4 sm:px-6 py-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                      <ImageIcon className="w-3.5 h-3.5" />Delivery Photos
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {(order as any).loaded_photo_url && (
                        <div className="text-center">
                          <a href={(order as any).loaded_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={(order as any).loaded_photo_url} alt="Loaded" className="w-14 h-14 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
                          </a>
                          <p className="text-[9px] text-gray-400 mt-0.5">Loaded</p>
                        </div>
                      )}
                      {(order as any).shipped_photo_url && (
                        <div className="text-center">
                          <a href={(order as any).shipped_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={(order as any).shipped_photo_url} alt="Shipped" className="w-14 h-14 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
                          </a>
                          <p className="text-[9px] text-gray-400 mt-0.5">Shipped</p>
                        </div>
                      )}
                      {(order as any).delivery_photo_url && (
                        <div className="text-center">
                          <a href={(order as any).delivery_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={(order as any).delivery_photo_url} alt="Received" className="w-14 h-14 rounded-lg object-cover border border-gray-200 hover:opacity-80" />
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
            )
          })}
        </div>
      )}
    </div>
  )
}
