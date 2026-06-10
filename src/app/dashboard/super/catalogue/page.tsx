import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperCatalogueClient from '@/components/catalogue/SuperCatalogueClient'

export default async function SuperCataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id, scope_state')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const scopeState = (profile as any).scope_state as string | null

  // Fetch branches scoped to super manager's state
  let branchQuery = supabase
    .from('branches')
    .select('id, name, city, state')
    .eq('company_id', profile.company_id)
    .order('name')
  if (scopeState) branchQuery = branchQuery.eq('state', scopeState)
  const { data: branches } = await branchQuery

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <SuperCatalogueClient
      branches={(branches || []) as any[]}
      categories={categories || []}
    />
  )
}
