import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ProductGrid from '@/components/catalogue/ProductGrid'
import CartBar from '@/components/catalogue/CartBar'

export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, company_id, branch_id, company:companies(id, name), branch:branches(id, name, city)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', categoryId)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, unit, image_url')
    .eq('category_id', categoryId)
    .eq('company_id', profile.company_id)
    .order('name')

  // Attach category name to each product for cart display
  const productsWithCategory = (products || []).map((p) => ({
    ...p,
    categoryName: category?.name || '',
  }))

  return (
    <AppShell user={profile as any}>
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Catalogue</p>
        <h1 className="text-2xl font-bold text-gray-900">{category?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{products?.length || 0} products</p>
      </div>

      <ProductGrid products={productsWithCategory} />

      <CartBar
        branchId={profile.branch_id!}
        companyId={profile.company_id}
        userId={profile.id}
      />
    </AppShell>
  )
}
