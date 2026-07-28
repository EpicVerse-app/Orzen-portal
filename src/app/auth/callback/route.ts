import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, hash } = new URL(request.url)

  // Supabase returns errors in the fragment for implicit-flow magic links
  // The fragment is not visible server-side, but Supabase also echoes error
  // params as query params in some flows — check both.
  const errorCode = searchParams.get('error_code') || searchParams.get('error')

  if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
    return NextResponse.redirect(
      new URL('/login?error=link_expired', request.url)
    )
  }

  const code    = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next    = rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=link_expired', request.url))
}
