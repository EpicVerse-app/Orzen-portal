import { redirect } from 'next/navigation'
import StoreManagerDashboard from '@/components/dashboard/StoreManagerDashboard'
import { getStoreProfile, getThemeColors } from '@/lib/auth/getStoreProfile'
import { createClient } from '@/lib/supabase/server'

export default async function StoreDashboardPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const { primaryColor, sidebarColor } = getThemeColors(profile)
  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any

  const supabase = await createClient()

  // Run orders + categories in parallel
  const [ordersResult, categoriesResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`id, status, created_at, items:order_items(id, quantity, product:products(id, name))`)
      .eq('branch_id', (branch as any)?.id)
      .order('created_at', { ascending: false })
      .limit(20),

    // Single query with embedded product count — no N+1
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
