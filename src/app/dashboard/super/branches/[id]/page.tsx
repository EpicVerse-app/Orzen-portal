import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BranchDetailClient from '@/components/branches/BranchDetailClient'

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, address, city, state, region, created_at')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!branch) notFound()

  const [{ data: staff }, { data: orders }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, role, created_at')
      .eq('branch_id', id)
      .order('role'),
    supabase
      .from('orders')
      .select('id, status, created_at, items:order_items(id, quantity)')
      .eq('branch_id', id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <BranchDetailClient
      branch={branch as any}
      allStaff={staff || []}
      allOrders={orders || []}
    />
  )
}
