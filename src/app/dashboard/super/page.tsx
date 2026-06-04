import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperManagerDashboard from '@/components/dashboard/SuperManagerDashboard'

export default async function SuperDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, scope_state, scope_region,
      company:companies(id, name, logo_url, slug, primary_color, sidebar_color)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/login')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, escalation_deadline,
      branch:branches(id, name, city, state),
      items:order_items(id)
    `)
    .eq('company_id', company?.id)
    .in('status', ['submitted', 'approved', 'rejected', 'packing', 'loaded', 'shipped'])
    .order('created_at', { ascending: true })

  const pendingOrders = (orders || []).filter((o) => o.status === 'submitted')
  const otherOrders = (orders || []).filter((o) => o.status !== 'submitted')

  const primaryColor  = (company as any)?.primary_color  || '#5B2D8E'
  const sidebarColor  = (company as any)?.sidebar_color  || '#2D1B4E'
  const logoUrl       = (company as any)?.logo_url       || null

  return (
    <SuperManagerDashboard
      profile={profile as any}
      pendingOrders={pendingOrders as any}
      otherOrders={otherOrders as any}
      primaryColor={primaryColor}
      sidebarColor={sidebarColor}
      logoUrl={logoUrl}
    />
  )
}
