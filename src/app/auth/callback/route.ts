import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Handles magic link clicks from email notifications.
 * Exchanges the auth code for a session then redirects
 * the user to the page that triggered the notification.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') // ?? '/dashboard'
  // Only allow relative paths to prevent open redirect attacks
//  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'
const next =
  rawNext &&
  rawNext.startsWith('/') &&
  !rawNext.startsWith('//')
    ? rawNext
    : '/dashboard'
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Fallback — send to login if anything went wrong
  return NextResponse.redirect(new URL('/login', request.url))
}
