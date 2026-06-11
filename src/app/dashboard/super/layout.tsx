export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperShell from '@/components/layout/SuperShell'

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, company_id, branch_id, scope_state, scope_region,
      company:companies(id, name, logo_url, slug, primary_color, sidebar_color)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company

  // Fetch active menu items ordered by display_order
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, path, icon, display_order, is_active')
    .eq('is_active', true)
    .order('display_order')

  const primaryColor = (company as any)?.primary_color || '#5B2D8E'
  const sidebarColor = (company as any)?.sidebar_color || '#2D1B4E'
  const logoUrl      = (company as any)?.logo_url      || null

  return (
    <SuperShell
      user={profile as any}
      menus={(menus || []) as any}
      primaryColor={primaryColor}
      sidebarColor={sidebarColor}
      logoUrl={logoUrl}
    >
      {children}
    </SuperShell>
  )
}
