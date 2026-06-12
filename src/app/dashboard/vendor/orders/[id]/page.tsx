import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/orders/OrderDetailView'
import VendorOrderActions from '@/components/orders/VendorOrderActions'
import VendorShipPhotoUpload from '@/components/orders/VendorShipPhotoUpload'
import VendorOrderDownloadButton from '@/components/orders/VendorOrderDownloadButton'

export default async function VendorOrderDetailPage({
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

  if (!profile || profile.role !== 'vendor') redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, rejection_reason,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      ordered_by_name, ordered_by_id,
      branch:branches(id, name, city, state, address),
      items:order_items(
        id, quantity,
        product:products(id, name, unit, price, image_url, image_url_2, image_url_3,
          category:categories(name)
        )
      )
    `)
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!order) notFound()

  const companyName = (profile as any)?.company?.name ?? 'Malabar Gold & Diamonds'

  const downloadBtn = (
    <VendorOrderDownloadButton
      orderId={order.id}
      createdAt={order.created_at}
      status={order.status}
      companyName={companyName}
      branch={order.branch as any}
      items={(order.items as any[]).map(i => ({
        quantity: i.quantity,
        product: {
          name:     i.product?.name,
          unit:     i.product?.unit,
          price:    i.product?.price,
          category: i.product?.category,
        },
      }))}
    />
  )

  return (
    <div className="px-4 sm:px-6 py-5">
      <OrderDetailView
        order={order as any}
        backHref="/dashboard/vendor"
        backLabel="Dashboard"
        actions={
          <div className="space-y-3">
            {order.status === 'approved' ? (
              <VendorOrderActions
                orderId={order.id}
                companyId={profile.company_id}
                branchId={(order.branch as any)?.id}
              />
            ) : order.status === 'shipped' ? (
              <VendorShipPhotoUpload
                orderId={order.id}
                companyId={profile.company_id}
                branchId={(order.branch as any)?.id}
                shortId={'ORD-' + order.id.replace(/-/g, '').slice(0, 6).toUpperCase()}
                existingPhotoUrl={(order as any).shipped_photo_url}
              />
            ) : null}
            {downloadBtn}
          </div>
        }
      />
    </div>
  )
}
