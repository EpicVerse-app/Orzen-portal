'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList,
  Truck, Package, ShoppingCart
} from 'lucide-react'
import { AppUser } from '@/types'
import LogoutButton from '@/components/ui/LogoutButton'
import CatalogueNav from '@/components/layout/CatalogueNav'
import TopHeader from '@/components/layout/TopHeader'
import { useCartStore } from '@/store/cartStore'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const STORE_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard/store',            icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'My Orders',  href: '/dashboard/store/orders',     icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Deliveries', href: '/dashboard/store/deliveries', icon: <Truck className="w-4 h-4" /> },
  { label: 'Inventory',  href: '/dashboard/store/inventory',  icon: <Package className="w-4 h-4" /> },
]

interface Props {
  user: AppUser
  children: React.ReactNode
  onCreateOrder?: () => void
}

export default function AppShell({ user, children, onCreateOrder }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { items, setOpen: openCart } = useCartStore()
  const cartCount = items.length

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Top Header */}
      <TopHeader
        user={user}
        onCreateOrder={onCreateOrder}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside className={`
          bg-[#1a1a1a] w-56 fixed top-14 bottom-0 left-0 z-40 flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="flex-1 px-3 py-5 overflow-y-auto">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
            <div className="space-y-0.5">
              {/* Dashboard */}
              <Link
                href="/dashboard/store"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/store'
                    ? 'bg-[#c9a84c] text-black'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Catalogue with dropdown */}
              <CatalogueNav
                companyId={user.company_id}
                onNavigate={() => setSidebarOpen(false)}
              />

              {/* View Order */}
              <Link
                href="/dashboard/store/view-order"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/store/view-order'
                    ? 'bg-[#c9a84c] text-black'
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="flex-1">View Order</span>
                {cartCount > 0 && (
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    pathname === '/dashboard/store/view-order'
                      ? 'bg-black text-[#c9a84c]'
                      : 'bg-[#c9a84c] text-black'
                  }`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Other nav items */}
              {STORE_NAV.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-[#c9a84c] text-black'
                      : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* User profile */}
          <div className="px-3 py-4 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center shrink-0">
                <span className="text-black text-xs font-bold">
                  {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
                <p className="text-gray-500 text-xs capitalize">{user.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* Overlay mobile */}
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
