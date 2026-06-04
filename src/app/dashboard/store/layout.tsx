import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getStoreProfile, getThemeColors } from '@/lib/auth/getStoreProfile'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const profile = await getStoreProfile()

  if (!profile || profile.role !== 'store_manager') redirect('/dashboard')

  const { primaryColor, sidebarColor, backgroundImage, logoUrl } = getThemeColors(profile)

  return (
    <AppShell
      user={profile as any}
      primaryColor={primaryColor}
      sidebarColor={sidebarColor}
      backgroundImage={backgroundImage}
      logoUrl={logoUrl}
    >
      {children}
    </AppShell>
  )
}
