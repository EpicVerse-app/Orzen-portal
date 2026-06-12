'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface BulkUserRow {
  full_name:    string
  email:        string
  password:     string
  role:         string
  branch_name?: string
  scope_state?: string
  scope_region?: string
}

export interface BulkUserResult {
  email:   string
  success: boolean
  error?:  string
}

export async function bulkCreateUsers(rows: BulkUserRow[]): Promise<BulkUserResult[]> {
  const supabase      = await createClient()
  const adminClient   = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return rows.map(r => ({ email: r.email, success: false, error: 'Not authenticated' }))

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return rows.map(r => ({ email: r.email, success: false, error: 'Unauthorized' }))
  }

  const companyId = profile.company_id

  // Pre-fetch all branches for this company to avoid N+1 lookups
  const { data: branches } = await adminClient
    .from('branches')
    .select('id, name')
    .eq('company_id', companyId)

  const branchMap: Record<string, string> = {}
  ;(branches || []).forEach(b => {
    branchMap[b.name.trim().toLowerCase()] = b.id
  })

  const results: BulkUserResult[] = []

  for (const row of rows) {
    try {
      // Validate required fields
      if (!row.full_name?.trim()) throw new Error('full_name is required')
      if (!row.email?.trim())     throw new Error('email is required')
      if (!row.password?.trim())  throw new Error('password is required')
      if (!row.role?.trim())      throw new Error('role is required')

      const validRoles = ['store_manager', 'store_head', 'super_manager', 'vendor']
      if (!validRoles.includes(row.role)) throw new Error(`Invalid role: ${row.role}`)

      // Resolve branch_id for branch-scoped roles
      let branchId: string | null = null
      if (row.role === 'store_manager' || row.role === 'store_head') {
        if (!row.branch_name?.trim()) throw new Error('branch_name required for store_manager/store_head')
        const key = row.branch_name.trim().toLowerCase()
        branchId = branchMap[key] ?? null
        if (!branchId) throw new Error(`Branch not found: "${row.branch_name}"`)
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email:          row.email.trim(),
        password:       row.password,
        email_confirm:  true,
        user_metadata:  { full_name: row.full_name.trim() },
      })

      if (authError) throw new Error(authError.message)
      const userId = authData.user.id

      // Insert into public.users
      const { error: insertError } = await adminClient.from('users').insert({
        id:           userId,
        company_id:   companyId,
        full_name:    row.full_name.trim(),
        email:        row.email.trim().toLowerCase(),
        role:         row.role,
        branch_id:    branchId,
        scope_state:  row.scope_state?.trim()  || null,
        scope_region: row.scope_region?.trim() || null,
      })

      if (insertError) {
        // Clean up auth user if profile insert fails
        await adminClient.auth.admin.deleteUser(userId)
        throw new Error(insertError.message)
      }

      results.push({ email: row.email, success: true })
    } catch (err: any) {
      results.push({ email: row.email, success: false, error: err.message })
    }
  }

  return results
}
