import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/orders/OrderDetailView'

export default async function SuperOrderDetailPage({
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
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

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
    .eq('company_id', profile.company_id)
    .single()

  if (!order) notFound()

  // RM is read-only — no actions
  return (
    <OrderDetailView
      order={order as any}
      backHref="/dashboard/super/orders"
      backLabel="Orders"
    />
  )
}
