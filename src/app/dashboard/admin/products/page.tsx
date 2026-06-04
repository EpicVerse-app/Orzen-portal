import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductManager from '@/components/admin/ProductManager'

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, company_id,
      company:companies(id, name, primary_color, sidebar_color, logo_url)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/login')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  // Fetch categories with products for this company
  const { data: categories } = await supabase
    .from('categories')
    .select(`
      id, name, description,
      products(id, name, unit, image_url)
    `)
    .eq('company_id', profile.company_id)
    .order('name')

  const primaryColor = (company as any)?.primary_color || '#5B2D8E'
  const logoUrl      = (company as any)?.logo_url      || null

  return (
    <ProductManager
      profile={profile as any}
      categories={(categories || []) as any}
      companyId={profile.company_id}
      primaryColor={primaryColor}
      logoUrl={logoUrl}
    />
  )
}
