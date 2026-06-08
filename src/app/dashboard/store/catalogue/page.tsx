import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import Link from 'next/link'
import { Tag, ChevronRight } from 'lucide-react'

// Cache categories per company for 60 seconds — they rarely change
function getCachedCategories(companyId: string) {
  return unstable_cache(
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name')
      return data || []
    },
    [`categories-${companyId}`],
    { revalidate: 60, tags: [`categories-${companyId}`] },
  )()
}

export default async function CataloguePage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const categories = await getCachedCategories(profile.company_id)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Materials</h1>
        <p className="text-sm text-gray-500 mt-1">Select a category to browse products</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No categories available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/dashboard/store/catalogue/${cat.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between hover:border-[#c9a84c] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#f5f0e8] rounded-xl flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-colors">
                  <Tag className="w-5 h-5 text-[#c9a84c]" />
                </div>
                <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#c9a84c] transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
