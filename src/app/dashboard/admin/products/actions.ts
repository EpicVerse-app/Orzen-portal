'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addProductAction(formData: FormData) {
  const supabase = await createClient()

  const name        = formData.get('name') as string
  const unit        = formData.get('unit') as string
  const category_id = formData.get('category_id') as string
  const company_id  = formData.get('company_id') as string
  const image_url   = (formData.get('image_url')   as string) || null
  const image_url_2 = (formData.get('image_url_2') as string) || null
  const image_url_3 = (formData.get('image_url_3') as string) || null
  const priceRaw    = formData.get('price') as string
  const price       = priceRaw ? parseFloat(priceRaw) : 0

  if (!name || !unit || !category_id || !company_id) {
    return { error: 'All fields are required.' }
  }

  const { error } = await supabase.from('products').insert({
    name,
    unit,
    price,
    category_id,
    company_id,
    image_url,
    image_url_2,
    image_url_3,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function updateProductAction(formData: FormData) {
  const supabase = await createClient()

  const product_id  = formData.get('product_id') as string
  const name        = formData.get('name') as string
  const unit        = formData.get('unit') as string
  const image_url   = (formData.get('image_url')   as string) || null
  const image_url_2 = (formData.get('image_url_2') as string) || null
  const image_url_3 = (formData.get('image_url_3') as string) || null
  const priceRaw    = formData.get('price') as string
  const price       = priceRaw ? parseFloat(priceRaw) : 0

  if (!product_id || !name || !unit) {
    return { error: 'Name and unit are required.' }
  }

  const { error } = await supabase
    .from('products')
    .update({ name, unit, price, image_url, image_url_2, image_url_3 })
    .eq('id', product_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function addCategoryAction(formData: FormData) {
  const supabase = await createClient()

  const name        = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const company_id  = formData.get('company_id') as string

  if (!name || !company_id) return { error: 'Category name is required.' }

  const { error } = await supabase.from('categories').insert({
    name,
    description,
    company_id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createClient()

  // Check if category has products
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  if ((count ?? 0) > 0) {
    return { error: 'Delete all products in this category first.' }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/products')
  return { success: true }
}
