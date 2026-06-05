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
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      branch:branches(id, name, address, city, state),
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, image_url_2, image_url_3, unit)
      )
    `)
    .eq('company_id', profile.company_id)
    .not('status', 'in', '("closed","rejected")')
    .order('created_at', { ascending: true })

  const allOrders = (orders || []) as any[]

  const stats = {
    waitingApproval: allOrders.filter(o => o.status === 'submitted').length,
    inProcess:       allOrders.filter(o => ['approved','packing','loaded','shipped'].includes(o.status)).length,
    delivered:       allOrders.filter(o => o.status === 'delivered').length,
    total:           allOrders.length,
  }

  return (
    <VendorDashboard
      profile={profile as any}
      orders={allOrders}
      stats={stats}
    />
  )
}
