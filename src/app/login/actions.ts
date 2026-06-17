'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUsersForDropdown(): Promise<{ username: string; full_name: string; role: string }[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('username, full_name, role')
    .not('username', 'is', null)
    .order('role')
    .order('full_name')
  return (data || []).filter(u => u.username)
}

export async function loginAction(username: string, password: string): Promise<string | void> {
  // 1. Resolve username → email using admin client
  const admin = createAdminClient()

  const { data: userRow, error: lookupError } = await admin
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (lookupError || !userRow) {
    return 'Invalid username or password.'
  }

  const { data: authData } = await admin.auth.admin.getUserById(userRow.id)
  if (!authData?.user?.email) {
    return 'Invalid username or password.'
  }

  // 2. Sign in using the server client — cookies() is writable in Server Actions,
  //    so the session gets saved into the response cookies automatically.
  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authData.user.email,
    password,
  })

  if (signInError) {
    return 'Invalid username or password.'
  }

  // 3. redirect() triggers an HTTP 303 with Set-Cookie already applied.
  //    The browser receives the cookie and the new page in one round-trip.
  redirect('/dashboard')
}
