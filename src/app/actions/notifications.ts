'use server'

import { createClient } from '@/lib/supabase/server'

interface NotifyPayload {
  orderId: string
  companyId: string
  title: string
  message: string
  type: string
  /** Roles that should receive this notification (company-wide) */
  targetRoles: string[]
  /** If provided, also notifies the store_manager of this specific branch */
  branchId?: string | null
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
    const supabase = await createClient()
    const userIds: string[] = []

    // Company-wide roles (super_manager, vendor)
    const companyRoles = targetRoles.filter(r => r !== 'store_manager')
    if (companyRoles.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', companyId)
        .in('role', companyRoles)
      ;(data || []).forEach(u => userIds.push(u.id))
    }

    // Branch-specific store manager
    if (targetRoles.includes('store_manager') && branchId) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('branch_id', branchId)
        .eq('role', 'store_manager')
      ;(data || []).forEach(u => userIds.push(u.id))
    }

    if (userIds.length === 0) return

    await supabase.from('notifications').insert(
      userIds.map(userId => ({
        user_id:    userId,
        company_id: companyId,
        title,
        message,
        type,
        order_id: orderId,
      }))
    )
  } catch (err) {
    console.error('sendOrderNotifications error:', err)
  }
}
