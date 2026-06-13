import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import ProductGrid from '@/components/catalogue/ProductGrid'
import CartBar from '@/components/catalogue/CartBar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const supabase = await createClient()

  const [categoryResult, productsResult] = await Promise.all([
    supabase.from('categories').select('id, name').eq('id', categoryId).single(),
    supabase.from('products').select('id, name, unit, price, image_url, image_url_2, image_url_3').eq('category_id', categoryId).eq('company_id', profile.company_id).order('name'),
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
          href="/dashboard/store/catalogue"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Order Materials
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{category?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{products.length} products</p>
      </div>

      <ProductGrid products={productsWithCategory} />

      <CartBar
        branchId={profile.branch_id!}
        companyId={profile.company_id}
        userId={profile.id}
        branchName={(Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any)?.name}
      />
    </>
  )
}
