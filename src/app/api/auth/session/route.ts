import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Receives access_token + refresh_token from the client after a successful
// signInWithPassword call and exchanges them for server-side session cookies.
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Tokens required' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              // Never set Secure over HTTP (breaks mobile dev)
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              httpOnly: true,
              path: '/',
            })
          })
        },
      },
    }
  )

  // Exchange the tokens — this triggers setAll with proper session cookies
  const { error } = await supabase.auth.setSession({ access_token, refresh_token })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return response
}
