'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'

interface Props {
  companyId: string
  onNavigate?: () => void
}

export default function CatalogueNav({ companyId, onNavigate }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const isCataloguePage = pathname.startsWith('/dashboard/store/catalogue')

  useEffect(() => {
    if (isCataloguePage) setOpen(true)
  }, [isCataloguePage])

  useEffect(() => {
    async function loadCategories() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .order('name')
      setCategories(data || [])
      setLoading(false)
    }
    if (open && categories.length === 0) loadCategories()
  }, [open, companyId])

  function handleCategoryClick(categoryId: string) {
    router.push(`/dashboard/store/catalogue/${categoryId}`)
    onNavigate?.()
  }

  return (
    <div>
      {/* Catalogue toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isCataloguePage
            ? 'bg-[#c9a84c] text-black'
            : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
        }`}
      >
        <BookOpen className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Catalogue</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        }
      </button>

      {/* Categories dropdown */}
      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-[#3a3a3a] space-y-0.5">
          {loading ? (
            <p className="text-xs text-gray-600 px-3 py-2">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2">No categories</p>
          ) : (
            categories.map((cat) => {
              const isActive = pathname === `/dashboard/store/catalogue/${cat.id}`
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#c9a84c]/20 text-[#c9a84c]'
                      : 'text-gray-500 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  <Tag className="w-3 h-3 shrink-0" />
                  {cat.name}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
