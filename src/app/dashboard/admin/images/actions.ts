'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateImageUrlAction(productId: string, imageUrl: string) {
  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ image_url: imageUrl || null })
    .eq('id', productId)
  revalidatePath('/dashboard/admin/images')
}
