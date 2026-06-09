import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/layout/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, company_id,
      company:companies(id, name, logo_url, primary_color, sidebar_color)
    `)
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company as any

  return (
    <AdminShell
      user={profile as any}
      logoUrl={company?.logo_url || null}
    >
      {children}
    </AdminShell>
  )
}
