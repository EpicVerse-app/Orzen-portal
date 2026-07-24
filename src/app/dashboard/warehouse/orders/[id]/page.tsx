import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/orders/OrderDetailView'
import WarehouseOrderActions from '@/components/orders/WarehouseOrderActions'
import { getVendors, getOrderAssignments } from '@/app/actions/warehouse'

function resolveCompanyName(profile: any): string {
  const c = profile?.company
  if (Array.isArray(c)) return c[0]?.name ?? 'Malabar Gold & Diamonds'
  return c?.name ?? 'Malabar Gold & Diamonds'
}

export default async function WarehouseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, company:companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'warehouse') redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, base_order_number, warehouse_status,
      ordered_by_name, ordered_by_id, shipped_photo_url,
      branch:branches(id, name, city, state, address),
      items:order_items(
        id, quantity,
        product:products(id, name, unit, price, image_url, image_url_2, image_url_3,
          category:categories(id, name)
        )
      )
    `)
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!order) notFound()

  // Group items by category
  const categoryMap: Record<string, { id: string; name: string; quantity: number }[]> = {}
  for (const item of (order.items as any[])) {
    const catName: string = item.product?.category?.name ?? 'Uncategorized'
    if (!categoryMap[catName]) categoryMap[catName] = []
    categoryMap[catName].push({
      id:       item.product?.id ?? item.id,
      name:     item.product?.name ?? 'Unknown',
      quantity: item.quantity,
    })
  }
  const categories = Object.entries(categoryMap).map(([name, items]) => ({ name, items }))

  const [vendors, assignments] = await Promise.all([
    getVendors(profile.company_id),
    getOrderAssignments(id),
  ])

  return (
    <div className="px-4 sm:px-6 py-5">
      <OrderDetailView
        order={order as any}
        backHref="/dashboard/warehouse"
        backLabel="Warehouse"
        actions={
          <WarehouseOrderActions
            orderId={order.id}
            companyId={profile.company_id}
            companyName={resolveCompanyName(profile)}
            assignedBy={profile.id}
            orderDate={order.created_at}
            branchName={(Array.isArray(order.branch) ? order.branch[0] : order.branch as any)?.name ?? ''}
            branchAddress={[
              (Array.isArray(order.branch) ? order.branch[0] : order.branch as any)?.address,
              (Array.isArray(order.branch) ? order.branch[0] : order.branch as any)?.city,
              (Array.isArray(order.branch) ? order.branch[0] : order.branch as any)?.state,
            ].filter(Boolean).join(', ')}
            branchId={(Array.isArray(order.branch) ? order.branch[0] : order.branch as any)?.id ?? ''}
            orderStatus={order.status}
            shippedPhotoUrl={(order as any).shipped_photo_url ?? null}
            vendors={vendors as any}
            categories={categories}
            initialAssignments={assignments as any}
            initialBaseOrderNumber={(order as any).base_order_number ?? null}
          />
        }
      />
    </div>
  )
}
