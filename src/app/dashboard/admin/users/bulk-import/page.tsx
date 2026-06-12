import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BulkImportClient from '@/components/admin/BulkImportClient'

export default async function BulkImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, city, state, region')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <BulkImportClient branches={branches || []} />
    </div>
  )
}
