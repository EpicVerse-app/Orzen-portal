'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'

interface Props {
  companyId: string
  onNavigate?: () => void
  gold?: string
  activeColor?: string
}

export default function CatalogueNav({
  companyId, onNavigate,
  gold = '#c9a84c',
  activeColor = '#c9a84c',
}: Props) {
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

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={isCataloguePage
          ? { backgroundColor: activeColor, color: '#000' }
          : { color: 'rgba(255,255,255,0.6)' }
        }
      >
        <ShoppingBag className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Order Materials</span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        }
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 space-y-0.5"
             style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          {loading ? (
            <p className="text-xs px-3 py-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs px-3 py-2" style={{ color: 'rgba(255,255,255,0.3)' }}>No categories</p>
          ) : (
            categories.map((cat) => {
              const isActive = pathname === `/dashboard/store/catalogue/${cat.id}`
              return (
                <button
                  key={cat.id}
                  onClick={() => { router.push(`/dashboard/store/catalogue/${cat.id}`); onNavigate?.() }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
                  style={isActive
                    ? { color: gold, backgroundColor: 'rgba(255,255,255,0.08)' }
                    : { color: 'rgba(255,255,255,0.45)' }
                  }
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
