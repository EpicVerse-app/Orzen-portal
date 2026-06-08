import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import DeliveryStatusClient from '@/components/orders/DeliveryStatusClient'
import { MapPin } from 'lucide-react'

export default async function DeliveryStatusPage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const branch = Array.isArray(profile.branch) ? profile.branch[0] : profile.branch as any
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      loaded_photo_url, shipped_photo_url,
      items:order_items(
        id, quantity,
        product:products(id, name, image_url, unit, category:categories(name))
      )
    `)
    .eq('branch_id', profile.branch_id)
    .eq('status', 'shipped')
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Status</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{(branch as any)?.name} — {(branch as any)?.city}</span>
        </div>
      </div>
      <DeliveryStatusClient
        orders={orders || []}
        companyId={(profile as any).company_id}
        branchId={(profile as any).branch_id}
      />
    </>
  )
}
