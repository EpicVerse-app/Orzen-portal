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
      id, full_name, role, scope_region, scope_state, company_id,
      company:companies(id, name, primary_color, sidebar_color),
      branch:branches(id, name, address, city, state, region)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch  = Array.isArray(profile.branch)  ? profile.branch[0]  : profile.branch  as any
  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  // Extract colors on the SERVER — avoids any client-side parsing issues
  const primaryColor = company?.primary_color || '#1a1a1a'
  const sidebarColor = company?.sidebar_color || '#111111'

  // Run orders + categories in parallel (cuts load time roughly in half)
  const [ordersResult, categoriesResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id, status, created_at,
        items:order_items(id, quantity, product:products(id, name))
      `)
      .eq('branch_id', (branch as any)?.id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Single query: embedded product count per category (no N+1)
    supabase
      .from('categories')
      .select('id, name, description, products:products(count)')
      .eq('company_id', profile.company_id)
      .limit(6),
  ])

  const orders = ordersResult.data || []

  const categories = (categoriesResult.data || []).map((cat: any) => ({
    id:            cat.id,
    name:          cat.name,
    description:   cat.description,
    product_count: Array.isArray(cat.products) ? (cat.products[0]?.count ?? 0) : 0,
  }))

  return (
    <StoreManagerDashboard
      profile={profile as any}
      orders={orders as any}
      categories={categories}
      primaryColor={primaryColor}
      sidebarColor={sidebarColor}
    />
  )
}
