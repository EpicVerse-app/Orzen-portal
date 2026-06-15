import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreProfile } from '@/lib/auth/getStoreProfile'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default async function CataloguePage() {
  const profile = await getStoreProfile()
  if (!profile || profile.role !== 'store_manager') redirect('/login')

  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .order('name')

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Materials</h1>
        <p className="text-sm text-gray-500 mt-1">Select a category to browse products</p>
      </div>

      {!categories || categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No categories available yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/dashboard/store/catalogue/${cat.id}`}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group ${idx !== 0 ? 'border-t border-gray-50' : ''}`}
            >
              <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{cat.name}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
