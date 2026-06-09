'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { m, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ClipboardList, Truck,
  Bell, Menu, X, LogOut, ChevronDown, ShieldCheck,
} from 'lucide-react'
import { AppUser } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Dashboard',  path: '/dashboard/store-head',           icon: LayoutDashboard, exact: true  },
  { label: 'Requests',   path: '/dashboard/store-head/requests',  icon: Package,         exact: false },
  { label: 'Orders',     path: '/dashboard/store-head/orders',    icon: ClipboardList,   exact: false },
  { label: 'Deliveries', path: '/dashboard/store-head/deliveries',icon: Truck,           exact: false },
]

interface Props {
  user: AppUser
  children: React.ReactNode
  primaryColor?: string
  sidebarColor?: string
  logoUrl?: string | null
}

export default function StoreHeadShell({ user, children, primaryColor, sidebarColor, logoUrl }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  const sidebarBg = sidebarColor || '#1a1a2e'
  const gold      = primaryColor  || '#c9a84c'

  function isActive(path: string, exact: boolean) {
    return exact ? pathname === path : pathname.startsWith(path)
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }

  function NavItem({ label, path, icon: Icon, exact }: typeof NAV[0]) {
    const active = isActive(path, exact)
    return (
      <div className="relative">
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full" style={{ backgroundColor: gold }} />
        )}
        <Link
          href={path}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-5 py-3 mx-2 rounded-xl text-sm font-medium transition-all ${
            active ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
          style={active ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {}}
        >
          <Icon className="w-4 h-4 shrink-0" style={{ color: active ? gold : undefined }} />
          {label}
        </Link>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: sidebarBg }}>
      {/* Logo / branding */}
      <div className="px-5 py-5 border-b border-white/10">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: gold }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Store Head</span>
          </div>
        )}
      </div>

      {/* Branch info */}
      <div className="px-5 py-3 border-b border-white/10">
        <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1">Branch</p>
        <p className="text-sm font-semibold text-white/80 truncate">
          {(user as any).branch?.name || 'No branch assigned'}
        </p>
        <p className="text-[11px] text-white/40 truncate">
          {(user as any).branch?.city}{(user as any).branch?.state ? `, ${(user as any).branch?.state}` : ''}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* Notifications + user */}
      <div className="border-t border-white/10 px-3 py-3 space-y-1">
        <Link
          href="/dashboard/store-head/notifications"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm"
        >
          <Bell className="w-4 h-4 shrink-0" />
          Notifications
        </Link>

        {/* User card */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 mt-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ backgroundColor: gold }}>
            {user.full_name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[10px] text-white/40">Store Head</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} title="Logout" className="shrink-0 text-white/30 hover:text-white/60 transition-colors">
            {loggingOut
              ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 shadow-lg">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <m.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-60 z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </m.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: gold }} />
            <span className="text-sm font-bold text-gray-800">Store Head</span>
          </div>
          <div className="ml-auto">
            <Link href="/dashboard/store-head/notifications" className="p-2 rounded-lg hover:bg-gray-100 transition-colors block">
              <Bell className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
