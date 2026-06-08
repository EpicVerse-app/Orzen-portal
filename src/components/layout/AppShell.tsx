'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Truck,
  ShoppingCart, Headphones, ShoppingBag, History
} from 'lucide-react'
import { AppUser } from '@/types'
import LogoutButton from '@/components/ui/LogoutButton'
import TopHeader from '@/components/layout/TopHeader'
import { useCartStore } from '@/store/cartStore'

interface Props {
  user: AppUser
  children: React.ReactNode
  primaryColor?: string
  sidebarColor?: string
  backgroundImage?: string | null
  logoUrl?: string | null
}

export default function AppShell({ user, children, primaryColor, sidebarColor, backgroundImage, logoUrl }: Props) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { items } = useCartStore()
  const cartCount = items.length

  const sidebarBg = sidebarColor || '#111111'
  const primary   = primaryColor || '#1a1a1a'
  const gold      = '#c9a84c'

  function isActive(href: string, exact = true) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function NavItem({
    href,
    icon: Icon,
    label,
    exact = true,
    badge,
  }: {
    href: string
    icon: React.ElementType
    label: string
    exact?: boolean
    badge?: number
  }) {
    const active = isActive(href, exact)
    return (
      <div className="relative">
        {/* Gold left-bar indicator */}
        {active && (
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
            style={{ backgroundColor: gold }}
          />
        )}
        <Link
          href={href}
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm transition-colors"
          style={
            active
              ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
              : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }
          }
        >
          <Icon className="w-4 h-4 shrink-0" style={active ? { color: gold } : {}} />
          <span className="flex-1">{label}</span>
          {badge != null && badge > 0 && (
            <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white">
              {badge}
            </span>
          )}
        </Link>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : { backgroundColor: '#f0ede8' }}
    >
      <TopHeader
        user={user}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        headerColor={primary}
        logoUrl={logoUrl}
      />

      <div className="flex flex-1 pt-20">
        {/* ── Sidebar ────────────────────────────────────────── */}
        <aside
          className={`
            w-56 fixed top-20 bottom-0 left-0 z-40 flex flex-col
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ backgroundColor: sidebarBg }}
        >
          {/* Nav links */}
          <nav className="flex-1 px-2 py-5 overflow-y-auto">
            <p
              className="text-[10px] font-bold tracking-widest uppercase px-3 mb-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Menu
            </p>

            <div className="space-y-0.5">
              <NavItem href="/dashboard/store"             icon={LayoutDashboard} label="Dashboard"       exact={true} />
              <NavItem href="/dashboard/store/catalogue"   icon={ShoppingBag}     label="Order Materials" exact={false} />
              <NavItem href="/dashboard/store/orders"      icon={ClipboardList}   label="My Orders"       exact={false} />
              <NavItem href="/dashboard/store/view-order"  icon={ShoppingCart}    label="View Cart"       exact={false} badge={cartCount} />
              <NavItem href="/dashboard/store/deliveries"        icon={Truck}   label="Delivery Status"  exact={true} />
              <NavItem href="/dashboard/store/delivery-history" icon={History} label="Delivery History" exact={false} />
            </div>
          </nav>

          {/* ── Need help card ─────────────────────────────── */}
          <div className="px-3 pb-2">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Headphones className="w-4 h-4 shrink-0" style={{ color: gold }} />
                <p className="text-sm font-bold text-white">Need help?</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Tap Support any time
              </p>
            </div>
          </div>

          {/* ── User + logout ──────────────────────────────── */}
          <div
            className="px-3 py-3 space-y-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 px-2 py-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
                style={{ backgroundColor: gold }}
              >
                {user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
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

          {/* ── Powered by ─────────────────────────────────── */}
          <div
            className="px-4 py-2 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Powered by&nbsp;
              <span style={{ color: gold }} className="font-semibold">Orzen Flow</span>
            </p>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-56 p-4 sm:p-6 min-w-0 overflow-x-hidden">
          {/* Frosted overlay when background image is set */}
          {backgroundImage && (
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }} />
          )}
          <m.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10"
          >
            {children}
          </m.div>
        </main>
      </div>
    </div>
  )
}

