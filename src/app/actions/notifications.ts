'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildOrderEmail } from '@/lib/email/templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Orzen Flow <onboarding@resend.dev>'

interface NotifyPayload {
  orderId: string
  companyId: string
  title: string
  message: string
  type: string
  targetRoles: string[]
  branchId?: string | null
}

/** Where each role lands based on notification type */
function getRedirectPath(role: string, type: string): string {
  if (role === 'super_manager') {
    return type === 'order_submitted'
      ? '/dashboard/super/requests'
      : '/dashboard/super/orders'
  }
  if (role === 'vendor') return '/dashboard/vendor'
  if (role === 'store_manager') return '/dashboard/store/orders'
  return '/dashboard'
}

export async function sendOrderNotifications({
  orderId,
  companyId,
  title,
  message,
  type,
  targetRoles,
  branchId,
}: NotifyPayload) {
  try {
    const supabase    = await createClient()
    const adminClient = createAdminClient()

    // ── 1. Find users to notify ──────────────────────────────
    type UserRow = { id: string; full_name: string; email: string | null; role: string }
    const recipients: UserRow[] = []

    const companyRoles = targetRoles.filter(r => r !== 'store_manager')
    if (companyRoles.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('company_id', companyId)
        .in('role', companyRoles)
      ;(data || []).forEach(u => recipients.push(u as UserRow))
    }

    if (targetRoles.includes('store_manager') && branchId) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('branch_id', branchId)
        .eq('role', 'store_manager')
      ;(data || []).forEach(u => recipients.push(u as UserRow))
    }

    if (recipients.length === 0) return

    // ── 2. Insert in-app notifications ──────────────────────
    await supabase.from('notifications').insert(
      recipients.map(u => ({
        user_id:    u.id,
        company_id: companyId,
        title,
        message,
        type,
        order_id: orderId,
      }))
    )

    // ── 3. Fetch order details for email body ────────────────
    const { data: order } = await supabase
      .from('orders')
      .select(`
        id, status,
        branch:branches(name, city),
        items:order_items(
          quantity,
          product:products(name, unit)
        )
      `)
      .eq('id', orderId)
      .single()

    if (!order) return

    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    const branch     = Array.isArray(order.branch) ? order.branch[0] : order.branch
    const shortId    = 'ORD-' + orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
    const companyName = (company as any)?.name || 'Orzen Flow'

    const emailItems = (order.items || []).map((i: any) => ({
      name:     i.product?.name  || 'Product',
      unit:     i.product?.unit  || 'pcs',
      quantity: i.quantity,
    }))

    // ── 4. Send email to each recipient ─────────────────────
    await Promise.all(
      recipients
        .filter(u => u.email)           // skip users with no email
        .map(async (u) => {
          try {
            // Generate magic link via admin API
            const redirectPath = getRedirectPath(u.role, type)
            const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
              type: 'magiclink',
              email: u.email!,
              options: {
                redirectTo: `${APP_URL}/auth/callback?next=${redirectPath}`,
              },
            })

            if (linkError || !linkData?.properties?.action_link) {
              console.error(`Magic link error for ${u.email}:`, linkError)
              return
            }

            const magicLink = linkData.properties.action_link
            const html = buildOrderEmail({
              recipientName: u.full_name || 'there',
              title,
              bodyText:      message,
              orderId:       shortId,
              branchName:    (branch as any)?.name || '',
              branchCity:    (branch as any)?.city || '',
              status:        order.status,
              items:         emailItems,
              magicLink,
              companyName,
            })

            await resend.emails.send({
              from:    FROM_EMAIL,
              to:      u.email!,
              subject: `${title} · ${shortId}`,
              html,
            })
          } catch (emailErr) {
            console.error(`Email failed for ${u.email}:`, emailErr)
          }
        })
    )
  } catch (err) {
    console.error('sendOrderNotifications error:', err)
  }
}
