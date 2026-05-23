'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProductAction(formData: FormData) {
  const supabase = await createClient()

  const name       = (formData.get('name') as string)?.trim()
  const unit       = (formData.get('unit') as string)?.trim()
  const categoryId = formData.get('category_id') as string
  const companyId  = formData.get('company_id')  as string

  if (!name || !unit || !categoryId || !companyId) {
    return { error: 'Name, unit and category are required.' }
  }

  const { error } = await supabase.from('products').insert({
    name,
    unit,
    category_id: categoryId,
    company_id:  companyId,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()
  await supabase.from('products').delete().eq('id', productId)
  revalidatePath('/dashboard/admin/products')
}

export async function addCategoryAction(formData: FormData) {
  const supabase  = await createClient()
  const name      = (formData.get('name') as string)?.trim()
  const companyId = formData.get('company_id') as string
  const desc      = (formData.get('description') as string)?.trim() || null

  if (!name || !companyId) return { error: 'Category name is required.' }

  const { error } = await supabase.from('categories').insert({
    name,
    description: desc,
    company_id: companyId,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createClient()
  await supabase.from('products').delete().eq('category_id', categoryId)
  await supabase.from('categories').delete().eq('id', categoryId)
  revalidatePath('/dashboard/admin/products')
}
