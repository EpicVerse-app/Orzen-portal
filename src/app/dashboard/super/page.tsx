import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperManagerDashboard from '@/components/dashboard/SuperManagerDashboard'

export default async function SuperDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile first (need companyId for the next queries)
  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, scope_state, scope_region, company_id,
      company:companies(id, name, logo_url, slug, primary_color, sidebar_color)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/login')

  const companyId = (profile as any).company_id

  // Run orders + branch count IN PARALLEL (not sequential)
  const [ordersResult, branchCountResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id, status, created_at,
        branch:branches(id, name, city, state),
        items:order_items(id, quantity, product:products(id, name, unit, image_url))
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100),

    supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
  ])

  const orders = ordersResult.data || []

  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'submitted').length,
    approved: orders.filter(o => ['approved', 'packing', 'loaded', 'shipped', 'delivered'].includes(o.status)).length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    branches: branchCountResult.count || 0,
  }

  return (
    <SuperManagerDashboard
      profile={profile as any}
      pendingOrders={orders.filter(o => o.status === 'submitted') as any}
      recentActivity={orders.slice(0, 20) as any}
      stats={stats}
    />
  )
}
