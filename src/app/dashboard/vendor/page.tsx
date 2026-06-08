import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorDashboard from '@/components/dashboard/VendorDashboard'

export default async function VendorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`id, full_name, role, company_id, company:companies(id, name)`)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') redirect('/dashboard')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      delivery_photo_url,
      branch:branches(id, name, address, city, state),
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, image_url_2, image_url_3, unit, category:categories(id, name))
      )
    `)
    .eq('company_id', profile.company_id)
    .in('status', ['approved', 'shipped', 'delivered'])
    .order('created_at', { ascending: true })

  const allOrders       = (orders || []) as any[]
  const newOrders       = allOrders.filter(o => o.status === 'approved')
  const shippedOrders   = allOrders.filter(o => o.status === 'shipped')
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered')

  const stats = {
    newOrders:  newOrders.length,
    shipped:    shippedOrders.length,
    delivered:  deliveredOrders.length,
    total:      allOrders.length,
  }

  return (
    <VendorDashboard
      profile={profile as any}
      companyId={profile.company_id}
      newOrders={newOrders}
      shippedOrders={shippedOrders}
      deliveredOrders={deliveredOrders}
      stats={stats}
    />
  )
}
