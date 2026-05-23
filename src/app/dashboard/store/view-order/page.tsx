import { redirect } from 'next/navigation'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import ViewOrderPage from '@/components/orders/ViewOrderPage'

export default async function ViewOrder() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  return (
    <ViewOrderPage
      branchId={profile.branch_id!}
      companyId={profile.company_id}
      userId={profile.id}
      branch={(Array.isArray(profile.branch) ? profile.branch[0] : profile.branch) as any}
    />
  )
}
