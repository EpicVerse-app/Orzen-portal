import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ViewOrderPage from '@/components/orders/ViewOrderPage'

export default async function ViewOrder() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, company_id, branch_id, company:companies(id, name), branch:branches(id, name, city, address, state)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_manager') redirect('/login')

  return (
    <AppShell user={profile as any}>
      <ViewOrderPage
        branchId={profile.branch_id!}
        companyId={profile.company_id}
        userId={profile.id}
        branch={(Array.isArray(profile.branch) ? profile.branch[0] : profile.branch) as any}
      />
    </AppShell>
  )
}
