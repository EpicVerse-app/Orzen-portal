import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/catalogue/ProductGrid'
import SuperCartBar from '@/components/catalogue/SuperCartBar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function SuperCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const [categoryResult, productsResult] = await Promise.all([
    supabase.from('categories').select('id, name').eq('id', categoryId).single(),
    supabase.from('products')
      .select('id, name, unit, image_url')
      .eq('category_id', categoryId)
      .eq('company_id', profile.company_id)
      .order('name'),
  ])

  const category = categoryResult.data
  const products = productsResult.data || []

  const productsWithCategory = products.map((p) => ({
    ...p,
    categoryName: category?.name || '',
  }))

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/super/catalogue"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Order Materials
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{category?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
      </div>

      <ProductGrid products={productsWithCategory} />

      <SuperCartBar />
    </>
  )
}
