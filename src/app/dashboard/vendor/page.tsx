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

  if (!profile || profile.role !== 'vendor') redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      branch:branches(id, name, address, city, state),
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit)
      )
    `)
    .eq('company_id', profile.company_id)
    .in('status', ['submitted', 'approved', 'packing', 'loaded', 'shipped'])
    .order('created_at', { ascending: true })

  const approvedOrders = (orders || []).filter((o) =>
    ['approved', 'packing', 'loaded', 'shipped'].includes(o.status)
  )
  const holdOrders = (orders || []).filter((o) => o.status === 'submitted')

  return (
    <VendorDashboard
      profile={profile as any}
      approvedOrders={approvedOrders as any}
      holdOrders={holdOrders as any}
    />
  )
}
