'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Truck,
  ShoppingBag, ShoppingCart, Headphones
} from 'lucide-react'
import { AppUser } from '@/types'
import LogoutButton from '@/components/ui/LogoutButton'
import CatalogueNav from '@/components/layout/CatalogueNav'
import TopHeader from '@/components/layout/TopHeader'
import { useCartStore } from '@/store/cartStore'

interface Props {
  user: AppUser
  children: React.ReactNode
  onCreateOrder?: () => void
  primaryColor?: string
  sidebarColor?: string
}

export default function AppShell({ user, children, onCreateOrder, primaryColor, sidebarColor }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { items } = useCartStore()
  const cartCount = items.length

  const sidebarBg = sidebarColor || '#111111'
  const primary   = primaryColor || '#1a1a1a'
  const gold      = '#c9a84c'

  function navClass(href: string, exact = true) {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return active
      ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors text-black'
      : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white/60 hover:text-white hover:bg-white/10'
  }

  function navStyle(href: string, exact = true) {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return active ? { backgroundColor: gold } : {}
  }

  return (
    <div className="min-h-screen bg-[#f0ede8] flex flex-col">
      <TopHeader
        user={user}
        onCreateOrder={onCreateOrder}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        headerColor={primary}
      />

      <div className="flex flex-1 pt-14">
        {/* ── Sidebar ────────────────────────────────────────── */}
        <aside
          className={`
            w-56 fixed top-14 bottom-0 left-0 z-40 flex flex-col
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ backgroundColor: sidebarBg }}
        >
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <p className="text-[10px] font-bold tracking-widest uppercase px-3 mb-3"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Menu
            </p>

            <div className="space-y-0.5">
              {/* Dashboard */}
              <Link href="/dashboard/store" onClick={() => setSidebarOpen(false)}
                className={navClass('/dashboard/store')} style={navStyle('/dashboard/store')}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Dashboard
              </Link>

              {/* My Orders */}
              <Link href="/dashboard/store/orders" onClick={() => setSidebarOpen(false)}
                className={navClass('/dashboard/store/orders')} style={navStyle('/dashboard/store/orders')}>
                <ClipboardList className="w-4 h-4 shrink-0" />
                My Orders
              </Link>

              {/* Delivery Status */}
              <Link href="/dashboard/store/deliveries" onClick={() => setSidebarOpen(false)}
                className={navClass('/dashboard/store/deliveries')} style={navStyle('/dashboard/store/deliveries')}>
                <Truck className="w-4 h-4 shrink-0" />
                Delivery Status
              </Link>

              {/* Order Materials (catalogue) */}
              <CatalogueNav
                companyId={user.company_id}
                onNavigate={() => setSidebarOpen(false)}
                gold={gold}
                activeColor={gold}
              />

              {/* View Order with cart badge */}
              <Link href="/dashboard/store/view-order" onClick={() => setSidebarOpen(false)}
                className={navClass('/dashboard/store/view-order')} style={navStyle('/dashboard/store/view-order')}>
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="flex-1">View Order</span>
                {cartCount > 0 && (
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </nav>

          {/* Support + user ───────────────────────────────── */}
          <div className="px-3 py-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Need help */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Headphones className="w-4 h-4 shrink-0" />
              Support
            </button>

            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
                style={{ backgroundColor: gold }}>
                {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
                <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-56 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
