import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetch the store manager profile once per request.
 * React's cache() deduplicates calls — layout + page both call this
 * but only one DB round-trip happens.
 */
export const getStoreProfile = cache(async () => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, full_name, role, company_id, branch_id,
      company:companies(id, name, primary_color, sidebar_color),
      branch:branches(id, name, city, address, state, region)
    `)
    .eq('id', user.id)
    .single()

  return profile
})

/** Extract theme colors from a resolved profile */
export function getThemeColors(profile: Awaited<ReturnType<typeof getStoreProfile>>) {
  const company     = Array.isArray(profile?.company) ? (profile.company as any)[0] : profile?.company as any
  const primaryColor = company?.primary_color || '#1a1a1a'
  const sidebarColor = company?.sidebar_color || '#111111'
  return { primaryColor, sidebarColor }
}
