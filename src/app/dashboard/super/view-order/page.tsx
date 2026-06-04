import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperViewOrderPage from '@/components/orders/SuperViewOrderPage'

export default async function SuperViewOrder() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  // Fetch all branches for this company for the branch selector
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, city, state')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <SuperViewOrderPage
      companyId={profile.company_id}
      userId={profile.id}
      branches={(branches || []) as any}
    />
  )
}
