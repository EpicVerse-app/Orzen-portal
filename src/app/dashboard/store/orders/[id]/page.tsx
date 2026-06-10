import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import OrderDetailView from '@/components/orders/OrderDetailView'
import VendorOrderDownloadButton from '@/components/orders/VendorOrderDownloadButton'

export default async function StoreOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, rejection_reason,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      branch:branches(name, city, state, address),
      items:order_items(
        id, quantity,
        product:products(id, name, unit, image_url, image_url_2, image_url_3,
          category:categories(name)
        )
      )
    `)
    .eq('id', id)
    .eq('branch_id', profile.branch_id)
    .single()

  if (!order) notFound()

  return (
    <OrderDetailView
      order={order as any}
      backHref="/dashboard/store/orders"
      backLabel="My Orders"
      actions={
        <VendorOrderDownloadButton
          orderId={order.id}
          createdAt={order.created_at}
          status={order.status}
          branch={Array.isArray(order.branch) ? order.branch[0] : order.branch as any}
          items={order.items as any}
        />
      }
    />
  )
}
