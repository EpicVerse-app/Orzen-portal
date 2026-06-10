import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductManager from '@/components/admin/ProductManager'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, company_id, company:companies(id, name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_manager'].includes(profile.role)) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, description, products(id, name, unit, price, image_url)')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <ProductManager
      profile={profile as any}
      categories={(categories || []) as any}
      companyId={profile.company_id}
    />
  )
}
