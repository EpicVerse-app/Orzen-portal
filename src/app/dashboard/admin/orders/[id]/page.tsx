import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDetailView from '@/components/orders/OrderDetailView'
import VendorOrderDownloadButton from '@/components/orders/VendorOrderDownloadButton'
import AdminApproveVendorButton from '@/components/orders/AdminApproveVendorButton'
import { CheckCircle } from 'lucide-react'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, company:companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, created_at, base_order_number, rejection_reason,
      vendor_approved, vendor_approved_at,
      loaded_photo_url, shipped_photo_url, delivery_photo_url,
      ordered_by_name, ordered_by_id,
      branch:branches(name, city, state, address),
      items:order_items(
        id, quantity,
        product:products(id, name, unit, price, image_url, image_url_2, image_url_3,
          category:categories(name)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const companyName = Array.isArray((profile as any)?.company)
    ? (profile as any).company[0]?.name
    : (profile as any)?.company?.name ?? ''

  const vendorApproved = (order as any).vendor_approved ?? false
  const hasAssignment  = !!(order as any).base_order_number

  return (
    <div className="px-4 sm:px-6 py-5">
      <OrderDetailView
        order={order as any}
        backHref="/dashboard/admin/orders"
        backLabel="Orders"
        companyName={companyName}
        vendorApproved={vendorApproved}
        actions={
          <div className="space-y-3">
            {/* Vendor approval section */}
            {hasAssignment && !vendorApproved && (
              <div className="space-y-2">
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pending Your Approval</p>
                  <p className="text-xs text-amber-600 mt-0.5">Vendor has been assigned. Approve to unlock PO generation for all users.</p>
                </div>
                <AdminApproveVendorButton orderId={order.id} />
              </div>
            )}

            {hasAssignment && vendorApproved && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs font-semibold text-green-700">PO Approved — generation unlocked</p>
              </div>
            )}

            <VendorOrderDownloadButton
              orderId={order.id}
              createdAt={order.created_at}
              status={order.status}
              companyName={companyName}
              orderedByName={(order as any).ordered_by_name}
              orderedById={(order as any).ordered_by_id}
              branch={Array.isArray(order.branch) ? order.branch[0] : order.branch as any}
              items={order.items as any}
            />
          </div>
        }
      />
    </div>
  )
}
