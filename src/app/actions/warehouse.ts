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

export async function assignVendor(input: AssignVendorInput) {
  const supabase = await createClient()

  // Generate order ID if not already assigned
  const { data: order } = await supabase
    .from('orders')
    .select('base_order_number')
    .eq('id', input.orderId)
    .single()

  let baseOrderNumber = order?.base_order_number
  if (!baseOrderNumber) {
    baseOrderNumber = await generateWarehouseOrderId(input.companyId)
    await supabase
      .from('orders')
      .update({ base_order_number: baseOrderNumber, warehouse_status: 'assigned' })
      .eq('id', input.orderId)
  } else {
    await supabase
      .from('orders')
      .update({ warehouse_status: 'assigned' })
      .eq('id', input.orderId)
  }

  // Remove existing assignments for this order (re-assign flow)
  await supabase.from('vendor_assignments').delete().eq('order_id', input.orderId)

  // Insert new assignments
  const rows = input.assignments.map(a => ({
    order_id:        input.orderId,
    vendor_id:       a.vendorId,
    assignment_type: input.assignmentType,
    category:        a.category ?? null,
    assigned_by:     input.assignedBy,
    status:          'assigned',
  }))

  const { error } = await supabase.from('vendor_assignments').insert(rows)
  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/warehouse/orders/${input.orderId}`)
  return { baseOrderNumber }
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
