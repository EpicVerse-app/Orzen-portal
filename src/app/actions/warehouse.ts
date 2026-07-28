'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildVendorAssignedEmail } from '@/lib/email/templates'
import { revalidatePath } from 'next/cache'

const resend     = new Resend(process.env.RESEND_API_KEY)
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL  || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL    || 'Orzen Flow <onboarding@resend.dev>'

export async function getVendors(companyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, gst_number, template_type, contact_name, contact_phone')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function generateWarehouseOrderId(companyId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('next_warehouse_order_id', {
    p_company_id: companyId,
  })
  if (error) throw new Error(error.message)
  return data as string
}

export interface AssignVendorInput {
  orderId: string
  companyId: string
  assignedBy: string
  assignmentType: 'total' | 'category'
  assignments: { vendorId: string; category?: string }[]
}

export async function assignVendor(input: AssignVendorInput): Promise<{ baseOrderNumber: string } | { error: string }> {
  const supabase = await createClient()

  try {
    // Generate order ID if not already assigned
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('base_order_number')
      .eq('id', input.orderId)
      .single()

    if (orderErr) return { error: `order fetch: ${orderErr.message}` }

    let baseOrderNumber = order?.base_order_number
    if (!baseOrderNumber) {
      const { data: newId, error: rpcErr } = await supabase.rpc('next_warehouse_order_id', {
        p_company_id: input.companyId,
      })
      if (rpcErr) return { error: `rpc next_warehouse_order_id: ${rpcErr.message}` }
      baseOrderNumber = newId as string

      const { error: upErr } = await supabase
        .from('orders')
        .update({ base_order_number: baseOrderNumber, warehouse_status: 'assigned' })
        .eq('id', input.orderId)
      if (upErr) return { error: `order update (new id): ${upErr.message}` }
    } else {
      const { error: upErr } = await supabase
        .from('orders')
        .update({ warehouse_status: 'assigned' })
        .eq('id', input.orderId)
      if (upErr) return { error: `order update (status): ${upErr.message}` }
    }

    // Remove existing assignments for this order (re-assign flow)
    const { error: delErr } = await supabase
      .from('vendor_assignments')
      .delete()
      .eq('order_id', input.orderId)
    if (delErr) return { error: `delete assignments: ${delErr.message}` }

    // Insert new assignments
    const rows = input.assignments.map(a => ({
      order_id:        input.orderId,
      vendor_id:       a.vendorId,
      assignment_type: input.assignmentType,
      category:        a.category ?? null,
      assigned_by:     input.assignedBy,
      status:          'assigned',
    }))

    const { error: insErr } = await supabase.from('vendor_assignments').insert(rows)
    if (insErr) return { error: `insert assignments: ${insErr.message}` }

    revalidatePath(`/dashboard/warehouse/orders/${input.orderId}`)

    // Notify admins (non-blocking — failure does not break assignment)
    notifyAdminsVendorAssigned({
      orderId:         input.orderId,
      companyId:       input.companyId,
      baseOrderNumber,
      vendorIds:       input.assignments.map(a => a.vendorId),
    }).catch(e => console.error('Admin vendor notification failed:', e))

    return { baseOrderNumber }
  } catch (e: any) {
    return { error: e?.message ?? 'unknown' }
  }
}

async function notifyAdminsVendorAssigned({
  orderId, companyId, baseOrderNumber, vendorIds,
}: {
  orderId: string
  companyId: string
  baseOrderNumber: string
  vendorIds: string[]
}) {
  const adminClient = createAdminClient()

  const [vendorRes, orderRes, companyRes, adminRes] = await Promise.all([
    adminClient.from('vendors').select('id, name').in('id', vendorIds),
    adminClient
      .from('orders')
      .select('branch:branches(name,city), items:order_items(quantity, product:products(name,unit))')
      .eq('id', orderId)
      .single(),
    adminClient.from('companies').select('name').eq('id', companyId).single(),
    adminClient.from('users').select('id, full_name, email').eq('company_id', companyId).eq('role', 'admin'),
  ])

  const vendorNames = (vendorRes.data || []).map((v: any) => v.name).join(', ')
  const branch      = Array.isArray(orderRes.data?.branch)
    ? (orderRes.data?.branch as any[])[0]
    : orderRes.data?.branch
  const emailItems  = ((orderRes.data as any)?.items || []).map((i: any) => ({
    name:     i.product?.name     || 'Product',
    unit:     i.product?.unit     || 'pcs',
    quantity: i.quantity,
  }))
  const companyName = (companyRes.data as any)?.name || 'Orzen Flow'

  await Promise.all(
    (adminRes.data || [])
      .filter((u: any) => u.email)
      .map(async (u: any) => {
        try {
          const { data: linkData } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: u.email,
            options: {
              redirectTo: `${APP_URL}/auth/callback?next=/dashboard/admin/orders/${orderId}`,
            },
          })
          if (!linkData?.properties?.action_link) return

          const html = buildVendorAssignedEmail({
            recipientName: u.full_name || 'Admin',
            orderRef:      baseOrderNumber,
            branchName:    (branch as any)?.name || '',
            branchCity:    (branch as any)?.city || '',
            vendorNames,
            items:         emailItems,
            magicLink:     linkData.properties.action_link,
            companyName,
          })

          await resend.emails.send({
            from:    FROM_EMAIL,
            to:      u.email,
            subject: `Vendor Assigned — ${baseOrderNumber} · Approval Required`,
            html,
          })
        } catch (e) {
          console.error(`Admin email failed for ${u.email}:`, e)
        }
      })
  )
}

export async function getOrderAssignments(orderId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendor_assignments')
    .select(`
      id, assignment_type, category, status,
      vendor:vendors(id, name, template_type, gst_number, address,
        bank_name, bank_account, bank_ifsc, terms)
    `)
    .eq('order_id', orderId)
    .order('created_at')
  return (data ?? []) as unknown as Array<{
    id: string
    assignment_type: string
    category: string | null
    status: string
    vendor: {
      id: string
      name: string
      template_type: string
      gst_number: string | null
      address: string | null
      bank_name: string | null
      bank_account: string | null
      bank_ifsc: string | null
      terms: string | null
    }
  }>
}
