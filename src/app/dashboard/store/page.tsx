import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StoreManagerDashboard from '@/components/dashboard/StoreManagerDashboard'

export default async function StoreDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, scope_region, scope_state,
      company:companies(id, name, logo_url, slug),
      branch:branches(id, name, address, city, state, region)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, escalation_deadline,
      items:order_items(id, quantity, product:products(id, name, image_url, unit))
    `)
    .eq('branch_id', branch?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <StoreManagerDashboard
      profile={profile as any}
      orders={(orders || []) as any}
    />
  )
}
