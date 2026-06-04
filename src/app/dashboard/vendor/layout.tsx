import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorShell from '@/components/layout/VendorShell'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`id, full_name, role, company_id, company:companies(id, name, logo_url, primary_color, sidebar_color)`)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') redirect('/dashboard')

  const company      = Array.isArray(profile.company) ? profile.company[0] : profile.company
  const primaryColor = (company as any)?.primary_color || '#5B2D8E'
  const sidebarColor = (company as any)?.sidebar_color || '#2D1B4E'
  const logoUrl      = (company as any)?.logo_url      || null

  return (
    <VendorShell
      user={profile as any}
      primaryColor={primaryColor}
      sidebarColor={sidebarColor}
      logoUrl={logoUrl}
    >
      {children}
    </VendorShell>
  )
}
