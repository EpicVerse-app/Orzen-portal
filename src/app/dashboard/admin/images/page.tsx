import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import ImageEditor from '@/components/admin/ImageEditor'

export default async function AdminImagesPage() {
  const profile = await getStoreProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .order('name')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, unit, image_url, category_id')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <ImageEditor
      categories={categories || []}
      products={products || []}
    />
  )
}
