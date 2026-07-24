'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    return { baseOrderNumber }
  } catch (e: any) {
    return { error: e?.message ?? 'unknown' }
  }
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
