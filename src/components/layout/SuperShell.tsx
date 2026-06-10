'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Menu, Headphones,
  LayoutDashboard, CheckCircle, FileText, Building2,
  ShoppingBag, Users, BarChart2, Settings, Circle,
  ClipboardList, Truck, Bell, LogOut, User, ChevronDown,
  Package, ShoppingCart, Store, Eye,
} from 'lucide-react'
import { AppUser } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SuperSearchBar from '@/components/layout/SuperSearchBar'
import CatalogueNavItem from '@/components/layout/CatalogueNavItem'

// Map DB icon name → Lucide component (kept for backward compat)
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, CheckCircle, FileText, Building2,
  ShoppingBag, Users, BarChart2, Settings, ClipboardList, Truck, Bell,
}

// Hardcoded nav — always in this order regardless of DB
const SUPER_NAV = [
  { label: 'Dashboard',       path: '/dashboard/super',               icon: LayoutDashboard, exact: true  },
  { label: 'Requests',        path: '/dashboard/super/requests',      icon: Package,         exact: false },
  { label: 'Order Materials', path: '/dashboard/super/catalogue',     icon: ShoppingBag,     exact: false },
  { label: 'View Cart',       path: '/dashboard/super/view-order',    icon: ShoppingCart,    exact: false },
  { label: 'Stores',          path: '/dashboard/super/branches',      icon: Store,           exact: false },
  { label: 'Overview',        path: '/dashboard/super/overview',      icon: Eye,             exact: false },
  { label: 'Reports',         path: '/dashboard/super/reports',       icon: BarChart2,       exact: false },
]

interface MenuItem {
  id: string
  name: string
  path: string
  icon: string
  display_order: number
  is_active: boolean
}

interface Props {
  user: AppUser
  menus: MenuItem[]
  children: React.ReactNode
  primaryColor?: string
  sidebarColor?: string
  logoUrl?: string | null
}

export default function SuperShell({
  user,
  menus,
  children,
  primaryColor,
  sidebarColor,
  logoUrl,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellRing,    setBellRing]    = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)

  const headerBg = primaryColor || '#570439'
  const sidebarBg = sidebarColor || '#570439'
  const gold = '#c9a84c'

  const company = Array.isArray(user.company)
    ? (user.company as any)[0]
    : (user.company as any)

  const initials = user.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Prefetch all nav routes so clicks are instant
  useEffect(() => {
    SUPER_NAV.forEach(item => router.prefetch(item.path))
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch unread notification count + bell shake
  useEffect(() => {
    async function fetchUnread() {
      const supabase = createClient()
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      const c = count || 0
      setUnreadCount(c)
      if (c > 0) { setBellRing(true); setTimeout(() => setBellRing(false), 700) }
    }
    fetchUnread()
  }, [user.id])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    window.location.href = '/login'
  }

  function isActive(path: string) {
    if (pathname === path) return true
    // Use prefix match for sub-pages (e.g. catalogue/[id])
    // but NOT for the dashboard root — that must be exact
    if (path === '/dashboard/super') return false
    return pathname.startsWith(path + '/')
  }

  function NavItem({ label, path, icon: Icon, exact = false }: { label: string; path: string; icon: React.ElementType; exact?: boolean }) {
    const active = exact ? pathname === path : (pathname === path || pathname.startsWith(path + '/'))
    return (
      <div className="relative">
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full" style={{ backgroundColor: gold }} />
        )}
        <Link
          href={path}
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 pl-5 pr-3 py-3 rounded-lg text-sm transition-colors active:opacity-70"
          style={
            active
              ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
              : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }
          }
        >
          <Icon className="w-4 h-4 shrink-0" style={active ? { color: gold } : {}} />
          <span className="flex-1">{label}</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="h-14 flex items-center px-3 sm:px-4 gap-3 fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: headerBg }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white/70 hover:text-white p-1 shrink-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo / company name */}
        <Link href="/dashboard/super" className="shrink-0 hover:opacity-80 transition-opacity">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={company?.name}
              className="h-11 w-auto object-contain max-w-[200px] sm:max-w-[280px]"
            />
          ) : (
            <p className="text-sm font-extrabold tracking-widest uppercase" style={{ color: gold }}>
              {company?.name}
            </p>
          )}
        </Link>

        <div className="flex-1" />

        {/* Search bar */}
        <SuperSearchBar companyId={(user as any).company_id} />

        {/* Notification bell */}
        <div ref={notifRef} className="relative shrink-0">
          <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
            className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className={`w-5 h-5 text-white/70 ${bellRing ? 'animate-bell' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pulse-ring">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="animate-dropdown absolute right-0 top-11 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-bold text-gray-800">Notifications</p>
                {unreadCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{unreadCount} new</span>}
              </div>
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{unreadCount === 0 ? 'All caught up!' : `${unreadCount} unread`}</p>
              </div>
              <div className="border-t border-gray-100 px-4 py-2">
                <Link href="/dashboard/super/notifications" onClick={() => setShowNotifs(false)}
                  className="text-xs font-semibold hover:underline" style={{ color: '#570439' }}>
                  View all →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative shrink-0">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/20 group-hover:ring-white/40 transition-all"
              style={{ backgroundColor: gold, color: '#000' }}
            >
              {initials}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-white/60 hidden sm:block transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="animate-dropdown absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">Super Manager</p>
                <p className="text-xs text-gray-400 mt-0.5">{company?.name}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/super/profile"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/super/notifications"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-4 h-4 text-gray-400" />
                  Notifications
                </Link>
                <Link
                  href="/dashboard/super/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

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
          {/* Nav links */}
          <nav className="flex-1 px-2 py-5 overflow-y-auto">
            <p
              className="text-[10px] font-bold tracking-widest uppercase px-3 mb-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Menu
            </p>
            <div className="space-y-0.5">
              {SUPER_NAV.map((item) =>
                item.label === 'Order Materials' ? (
                  <CatalogueNavItem
                    key={item.path}
                    requireBranchSelection
                    companyId={(user as any).company_id}
                    baseUrl="/dashboard/super/catalogue"
                    onNavigate={() => setSidebarOpen(false)}
                  />
                ) : (
                  <NavItem key={item.path} label={item.label} path={item.path} icon={item.icon} exact={item.exact} />
                )
              )}
            </div>
          </nav>

          {/* Need help card */}
          <div className="px-3 pb-2">
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
              <div className="flex items-center gap-2 mb-0.5">
                <Headphones className="w-4 h-4 shrink-0" style={{ color: gold }} />
                <p className="text-sm font-bold text-white">Need help?</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Tap Support any time
              </p>
            </div>
          </div>

          {/* User + logout */}
          <div className="px-3 py-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 px-2 py-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
                style={{ backgroundColor: gold }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
                <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Super Manager
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>

          {/* Powered by */}
          <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Powered by&nbsp;
              <span style={{ color: gold }} className="font-semibold">Orzen Flow</span>
            </p>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
            style={{ backdropFilter: 'blur(2px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-56 min-w-0 overflow-x-hidden">
          <m.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {children}
          </m.div>
        </main>
      </div>
    </div>
  )
}
