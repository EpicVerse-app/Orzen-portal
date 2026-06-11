import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/orders/OrderDetailView'
import StoreHeadOrderActions from '@/components/orders/StoreHeadOrderActions'
import VendorOrderDownloadButton from '@/components/orders/VendorOrderDownloadButton'

export default async function StoreHeadOrderDetailPage({
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
    .select('id, role, company_id, branch_id, company:companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_head') redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, rejection_reason,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      branch:branches(id, name, city, state, address),
      items:order_items(
        id, quantity,
        product:products(id, name, unit, price, image_url, image_url_2, image_url_3,
          category:categories(name)
        )
      )
    `)
    .eq('id', id)
    .eq('branch_id', profile.branch_id)
    .single()

  if (!order) notFound()

  const companyName = Array.isArray((profile as any)?.company)
    ? (profile as any).company[0]?.name
    : (profile as any)?.company?.name ?? 'Malabar Gold & Diamonds'

  return (
    <div className="px-4 sm:px-6 py-5">
      <OrderDetailView
        order={order as any}
        backHref="/dashboard/store-head/orders"
        backLabel="Orders"
        actions={
          <div className="space-y-3">
            {order.status === 'submitted' && (
              <StoreHeadOrderActions
                orderId={order.id}
                companyId={profile.company_id}
                approverId={profile.id}
                branchId={(order.branch as any)?.id}
              />
            )}
            <VendorOrderDownloadButton
              orderId={order.id}
              createdAt={order.created_at}
              status={order.status}
              companyName={companyName}
              branch={Array.isArray(order.branch) ? order.branch[0] : order.branch as any}
              items={order.items as any}
            />
          </div>
        }
      />
    </div>
  )
}
