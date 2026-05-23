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

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch

  // Recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      items:order_items(id, quantity, product:products(id, name))
    `)
    .eq('branch_id', branch?.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Categories with product count
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, name, description')
    .eq('company_id', profile.company_id)
    .limit(6)

  // Get product count per category
  const categories = await Promise.all(
    (rawCategories || []).map(async (cat) => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id)
      return { ...cat, product_count: count || 0 }
    })
  )

  return (
    <StoreManagerDashboard
      profile={profile as any}
      orders={(orders || []) as any}
      categories={categories}
    />
  )
}
