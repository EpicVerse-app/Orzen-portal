export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StoreHeadShell from '@/components/layout/StoreHeadShell'

export default async function StoreHeadLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, company_id, branch_id,
      company:companies(id, name, logo_url, primary_color, sidebar_color),
      branch:branches(id, name, city, state, region)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'store_head') redirect('/dashboard')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  return (
    <StoreHeadShell
      user={profile as any}
      primaryColor={company?.primary_color || '#c9a84c'}
      sidebarColor={company?.sidebar_color || '#1a1a2e'}
      logoUrl={company?.logo_url || null}
    >
      {children}
    </StoreHeadShell>
  )
}
