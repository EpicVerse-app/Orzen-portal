import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, MapPin, Map } from 'lucide-react'

export default async function SuperBranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, address, city, state, region')
    .eq('company_id', profile.company_id)
    .order('name')

  const allBranches = branches || []

  // Group by state
  const byState = allBranches.reduce<Record<string, typeof allBranches>>((acc, branch) => {
    const s = branch.state || 'Other'
    if (!acc[s]) acc[s] = []
    acc[s].push(branch)
    return acc
  }, {})

  return (
    <div className="px-4 sm:px-6 py-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/super"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-400 mt-0.5">{allBranches.length} total branches</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {allBranches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No branches found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byState).map(([state, stateBranches]) => (
            <div key={state}>
              {/* State header */}
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  {state}
                </h2>
                <span className="text-xs text-gray-400">({stateBranches.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stateBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
                  >
                    {/* Branch name + region badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
                      </div>
                      {branch.region && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          {branch.region}
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {branch.address && `${branch.address}, `}{branch.city}, {branch.state}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
