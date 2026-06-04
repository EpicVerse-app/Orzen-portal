import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingBag, ArrowRight, Package } from 'lucide-react'

// Rotating colour palette for cards
const CARD_STYLES = [
  { bg: 'from-purple-500 to-purple-700',    light: 'bg-purple-100',   icon: 'text-purple-600' },
  { bg: 'from-amber-400 to-orange-500',     light: 'bg-amber-100',    icon: 'text-amber-600'  },
  { bg: 'from-emerald-500 to-teal-600',     light: 'bg-emerald-100',  icon: 'text-emerald-600'},
  { bg: 'from-blue-500 to-indigo-600',      light: 'bg-blue-100',     icon: 'text-blue-600'   },
  { bg: 'from-rose-500 to-pink-600',        light: 'bg-rose-100',     icon: 'text-rose-600'   },
  { bg: 'from-slate-600 to-slate-800',      light: 'bg-slate-100',    icon: 'text-slate-600'  },
]

export default async function SuperCataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_manager') redirect('/dashboard')

  // Fetch categories with product count
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, products(id)')
    .eq('company_id', profile.company_id)
    .order('name')

  const cats = categories || []

  return (
    <div className="px-4 sm:px-6 py-5">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Materials</h1>
            <p className="text-sm text-gray-400">
              {cats.length} {cats.length === 1 ? 'category' : 'categories'} available
            </p>
          </div>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-500">No categories yet</p>
          <p className="text-sm text-gray-400 mt-1">Ask your admin to add product categories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {cats.map((cat, i) => {
            const style   = CARD_STYLES[i % CARD_STYLES.length]
            const prodCount = (cat.products as any)?.length ?? 0

            return (
              <Link
                key={cat.id}
                href={`/dashboard/super/catalogue/${cat.id}`}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient background */}
                <div className={`bg-gradient-to-br ${style.bg} p-6 pb-14`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full">
                      {prodCount} {prodCount === 1 ? 'product' : 'products'}
                    </span>
                  </div>

                  {/* Category name */}
                  <h2 className="text-lg font-bold text-white leading-tight">{cat.name}</h2>
                  <p className="text-sm text-white/60 mt-1">Tap to browse & order</p>
                </div>

                {/* White footer strip */}
                <div className="absolute bottom-0 left-0 right-0 bg-white px-5 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">View products</span>
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
