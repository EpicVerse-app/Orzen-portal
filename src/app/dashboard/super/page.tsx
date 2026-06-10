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

  const companyId   = (profile as any).company_id
  const scopeState  = (profile as any).scope_state  as string | null
  const scopeRegion = (profile as any).scope_region as string | null

  // Get branch IDs scoped to this super manager's state + region
  let branchQuery = supabase.from('branches').select('id').eq('company_id', companyId)
  if (scopeState)  branchQuery = branchQuery.eq('state', scopeState)
  if (scopeRegion) branchQuery = branchQuery.eq('region', scopeRegion)
  const { data: scopedBranches } = await branchQuery
  const branchIds = (scopedBranches || []).map(b => b.id)

  // Run orders + branch count IN PARALLEL (not sequential)
  const [ordersResult, branchCountResult] = await Promise.all([
    branchIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase
          .from('orders')
          .select(`
            id, status, created_at,
            branch:branches(id, name, city, state),
            items:order_items(id, quantity, product:products(id, name, unit, image_url))
          `)
          .eq('company_id', companyId)
          .in('branch_id', branchIds)
          .order('created_at', { ascending: false })
          .limit(100),

    Promise.resolve({ count: branchIds.length }),
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
