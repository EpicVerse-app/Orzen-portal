'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildVendorApprovedEmail } from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'

const resend    = new Resend(process.env.RESEND_API_KEY)
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL   || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL    || 'Orzen Flow <onboarding@resend.dev>'

export async function approveVendorAssignment(
  orderId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase    = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Unauthorized' }

  // Mark order as approved
  const { error: upErr } = await adminClient
    .from('orders')
    .update({
      vendor_approved:    true,
      vendor_approved_by: user.id,
      vendor_approved_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (upErr) return { error: upErr.message }

  // Fetch order + company for email
  const [orderRes, companyRes] = await Promise.all([
    adminClient
      .from('orders')
      .select('base_order_number, branch:branches(name, city)')
      .eq('id', orderId)
      .single(),
    adminClient
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single(),
  ])

  const order       = orderRes.data
  const companyName = (companyRes.data as any)?.name || 'Orzen Flow'
  const branch      = Array.isArray(order?.branch) ? (order?.branch as any[])[0] : order?.branch
  const orderRef    = (order as any)?.base_order_number || orderId.slice(0, 8).toUpperCase()

  // Notify warehouse users
  const { data: warehouseRaw } = await adminClient
    .from('users')
    .select('id, full_name, email')
    .eq('company_id', profile.company_id)
    .eq('role', 'warehouse')

  // Resolve email from auth.users when not stored in public.users
  const warehouseUsers = await Promise.all(
    (warehouseRaw || []).map(async (u: any) => {
      if (u.email) return u
      const { data: authUser } = await adminClient.auth.admin.getUserById(u.id)
      return { ...u, email: authUser?.user?.email ?? null }
    })
  )

  await Promise.all(
    warehouseUsers
      .filter((u: any) => u.email)
      .map(async (u: any) => {
        try {
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: u.email,
            options: {
              redirectTo: `${APP_URL}/auth/callback?next=/dashboard/warehouse`,
            },
          })
          if (!linkData?.properties?.action_link) return

          const html = buildVendorApprovedEmail({
            recipientName: u.full_name || 'there',
            orderRef,
            branchName: (branch as any)?.name || '',
            magicLink:  linkData.properties.action_link,
            companyName,
          })

          await resend.emails.send({
            from:    FROM_EMAIL,
            to:      u.email,
            subject: `PO Approved — ${orderRef}`,
            html,
          })
        } catch (e) {
          console.error('Warehouse email failed:', e)
        }
      })
  )

  revalidatePath(`/dashboard/admin/orders/${orderId}`)
  return { ok: true }
}
