import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types'

const ROLE_REDIRECTS: Record<UserRole, string> = {
  store_manager: '/dashboard/store',
  super_manager: '/dashboard/super',
  mvm: '/dashboard/mvm',
  hvm: '/dashboard/hvm',
  vendor: '/dashboard/vendor',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const target = ROLE_REDIRECTS[profile.role as UserRole]
  if (target) redirect(target)

  redirect('/login')
}
