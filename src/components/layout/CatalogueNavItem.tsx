'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingBag, Tag, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'

interface Category { id: string; name: string }

interface Props {
  companyId: string
  baseUrl: string
  onNavigate?: () => void
  gold?: string
  requireBranchSelection?: boolean
}

export default function CatalogueNavItem({
  companyId, baseUrl, onNavigate, gold = '#c9a84c', requireBranchSelection = false,
}: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const { selectedBranchId } = useCartStore()
  const triggerRef = useRef<HTMLDivElement>(null)

  const [categories, setCategories]         = useState<Category[]>([])
  const [loaded, setLoaded]                 = useState(false)
  const [loading, setLoading]               = useState(false)
  const [desktopOpen, setDesktopOpen]       = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [flyoutPos, setFlyoutPos]           = useState({ top: 0, left: 0 })
  const [mounted, setMounted]               = useState(false)

  // Portal needs the DOM
  useEffect(() => { setMounted(true) }, [])

  const isActive = pathname === baseUrl || pathname.startsWith(baseUrl + '/')

  const loadCategories = useCallback(async () => {
    if (loaded || loading) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name')
    setCategories(data || [])
    setLoaded(true)
    setLoading(false)
  }, [companyId, loaded, loading])

  function handleCategoryClick(e: React.MouseEvent, catId: string) {
    if (requireBranchSelection && !selectedBranchId) {
      e.preventDefault()
      setDesktopOpen(false)
      setMobileExpanded(false)
      onNavigate?.()
      router.push(baseUrl)
    }
  }

  function handleMouseEnter() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setFlyoutPos({ top: r.top, left: r.right + 8 })
    }
    loadCategories()
    setDesktopOpen(true)
  }

  // Flyout panel — rendered in a portal so it escapes sidebar overflow clipping
  const flyout = (
    <AnimatePresence>
      {desktopOpen && (
        <m.div
          initial={{ opacity: 0, x: -8, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
          onMouseEnter={() => setDesktopOpen(true)}
          onMouseLeave={() => setDesktopOpen(false)}
          style={{
            position: 'fixed',
            top: flyoutPos.top,
            left: flyoutPos.left,
            zIndex: 9999,
          }}
          className="w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" style={{ color: gold }} />
            <p className="text-xs font-bold text-gray-600 tracking-wider uppercase">Categories</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-5 text-center">No categories found</p>
          ) : (
            <div className="py-1 max-h-72 overflow-y-auto">
              {categories.map((cat, i) => (
                <m.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.14 }}
                >
                  <Link
                    href={`${baseUrl}/${cat.id}`}
                    onClick={(e) => { handleCategoryClick(e, cat.id); setDesktopOpen(false); onNavigate?.() }}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <Tag className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium transition-colors">
                      {cat.name}
                    </span>
                  </Link>
                </m.div>
              ))}
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative">

      {/* ── Desktop hover trigger ─────────────────────────── */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setDesktopOpen(false)}
        className="hidden lg:block relative"
      >
        {isActive && (
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
            style={{ backgroundColor: gold }}
          />
        )}
        <Link
          href={baseUrl}
          className="flex items-center gap-3 pl-5 pr-3 py-3 rounded-lg text-sm transition-colors"
          style={isActive
            ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
            : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" style={isActive ? { color: gold } : {}} />
          <span className="flex-1">Order Materials</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
        </Link>

        {/* Portal — escapes sidebar overflow clipping */}
        {mounted && createPortal(flyout, document.body)}
      </div>

      {/* ── Mobile: tap to expand inline ─────────────────── */}
      <div className="lg:hidden relative">
        {isActive && (
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
            style={{ backgroundColor: gold }}
          />
        )}
        <button
          onClick={() => { loadCategories(); setMobileExpanded(v => !v) }}
          className="w-full flex items-center gap-3 pl-5 pr-3 py-3 rounded-lg text-sm transition-colors text-left"
          style={isActive
            ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
            : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" style={isActive ? { color: gold } : {}} />
          <span className="flex-1">Order Materials</span>
          <m.span animate={{ rotate: mobileExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
          </m.span>
        </button>

        <AnimatePresence initial={false}>
          {mobileExpanded && (
            <m.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflow: 'hidden' }}
            >
              {loading ? (
                <div className="pl-12 py-3">
                  <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                </div>
              ) : (
                <div className="pl-12 pb-2 space-y-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`${baseUrl}/${cat.id}`}
                      onClick={(e) => { handleCategoryClick(e, cat.id); setMobileExpanded(false); onNavigate?.() }}
                      className="flex items-center gap-2 py-2 pr-3 text-sm rounded-lg transition-colors active:opacity-60"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      <Tag className="w-3 h-3 shrink-0 opacity-50" />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
