import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import MyOrdersClient from '@/components/orders/MyOrdersClient'
import { MapPin } from 'lucide-react'

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any
  const { search } = await searchParams

  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit,
          category:categories(name)
        )
      )
    `)
    .eq('branch_id', profile.branch_id)
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{(branch as any)?.name} — {(branch as any)?.city}</span>
        </div>
      </div>

      <MyOrdersClient
        key={search || ''}
        orders={orders || []}
        initialSearch={search || ''}
      />
    </>
  )
}
