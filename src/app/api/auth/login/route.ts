import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  // 1. Look up email from username using admin client
  const admin = createAdminClient()

  const { data: user, error: lookupError } = await admin
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (lookupError || !user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const { data: authData } = await admin.auth.admin.getUserById(user.id)
  if (!authData?.user?.email) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // 2. Sign in server-side and write session cookie into the response
  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write every session cookie into the response so the
          // browser receives them before the next navigation
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              // Ensure cookies work in mobile browsers over HTTP dev
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
            })
          )
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: authData.user.email,
    password,
  })

  if (signInError) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  return response
}
