import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorTotalOrdersView from '@/components/vendor/VendorTotalOrdersView'

export default async function VendorTotalOrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') redirect('/dashboard')

  // Fetch ALL orders (no limit) for breakdown view
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, created_at,
      branch:branches(id, name, address, city, state)
    `)
    .eq('company_id', profile.company_id)
    .in('status', ['approved', 'shipped', 'delivered'])
    .order('created_at', { ascending: false })

  return (
    <VendorTotalOrdersView orders={(orders || []) as any[]} />
  )
}
