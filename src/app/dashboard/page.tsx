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

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Profile not found — show setup error instead of redirect loop
  if (!profile || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Account not set up</h2>
          <p className="text-sm text-gray-500">
            Your account exists but has not been assigned a role yet. Please contact your administrator.
          </p>
          <p className="text-xs text-gray-400 mt-4 font-mono break-all">User ID: {user.id}</p>
        </div>
      </div>
    )
  }

  const target = ROLE_REDIRECTS[profile.role as UserRole]
  if (target) redirect(target)

  redirect('/login')
}
