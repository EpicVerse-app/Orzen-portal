'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, Headphones,
  LayoutDashboard, CheckCircle, FileText, Building2,
  ShoppingBag, Users, BarChart2, Settings, Circle,
  ClipboardList, Truck, Bell, LogOut, User, ChevronDown,
} from 'lucide-react'
import { AppUser } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import SuperSearchBar from '@/components/layout/SuperSearchBar'

// Map DB icon name → Lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  CheckCircle,
  FileText,
  Building2,
  ShoppingBag,
  Users,
  BarChart2,
  Settings,
  ClipboardList,
  Truck,
  Bell,
}

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
  const [loggingOut, setLoggingOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const headerBg = primaryColor || '#5B2D8E'
  const sidebarBg = sidebarColor || '#2D1B4E'
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

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    window.location.href = '/login'
  }

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + '/')
  }

  function NavItem({ item }: { item: MenuItem }) {
    const Icon = ICON_MAP[item.icon] || Circle
    const active = isActive(item.path)

    return (
      <div className="relative">
        {active && (
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
            style={{ backgroundColor: gold }}
          />
        )}
        <Link
          href={item.path}
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm transition-colors"
          style={
            active
              ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
              : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }
          }
        >
          <Icon className="w-4 h-4 shrink-0" style={active ? { color: gold } : {}} />
          <span className="flex-1">{item.name}</span>
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
              className="h-8 sm:h-10 w-auto object-contain max-w-[140px] sm:max-w-[180px]"
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
        <Link
          href="/dashboard/super/notifications"
          className="relative p-1.5 text-white/70 hover:text-white transition-colors shrink-0"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative shrink-0">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: gold, color: '#000' }}
            >
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/60 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
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
              {menus.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
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
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-56 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
