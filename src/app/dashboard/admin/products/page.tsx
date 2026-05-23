import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import ProductManager from '@/components/admin/ProductManager'

export default async function AdminProductsPage() {
  const profile = await getStoreProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  // Fetch all categories + their products in one go
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, description')
    .eq('company_id', profile.company_id)
    .order('name')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, unit, category_id')
    .eq('company_id', profile.company_id)
    .order('name')

  const company = Array.isArray(profile.company) ? (profile.company as any)[0] : profile.company as any

  return (
    <ProductManager
      categories={categories || []}
      products={products || []}
      companyId={profile.company_id}
      companyName={company?.name || ''}
    />
  )
}
