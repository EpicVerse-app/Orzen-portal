import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { username } = await req.json()

  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Look up user by username
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get their email from Supabase Auth
  const { data: authData } = await supabase.auth.admin.getUserById(user.id)

  if (!authData?.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ email: authData.user.email })
}
