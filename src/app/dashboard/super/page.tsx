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
  const companyId = (company as any)?.id

  // Fetch ALL orders for the company (for stats + activity + approvals)
  const { data: allOrders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      branch:branches(id, name, city, state),
      items:order_items(id, quantity, product:products(id, name, unit, image_url))
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  // Fetch branch count
  const { count: branchCount } = await supabase
    .from('branches')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)

  const orders = allOrders || []

  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'submitted').length,
    approved: orders.filter(o => ['approved', 'packing', 'loaded', 'shipped', 'delivered'].includes(o.status)).length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    branches: branchCount || 0,
  }

  const pendingOrders  = orders.filter(o => o.status === 'submitted')
  const recentActivity = orders.slice(0, 20)   // latest 20 for activity feed

  return (
    <SuperManagerDashboard
      profile={profile as any}
      pendingOrders={pendingOrders as any}
      recentActivity={recentActivity as any}
      stats={stats}
    />
  )
}
