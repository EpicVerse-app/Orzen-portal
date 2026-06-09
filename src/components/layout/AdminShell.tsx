'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Store, Users,
  ShoppingBag, BarChart2, Settings,
  Menu, Bell, LogOut, ChevronDown, Headphones, X,
  User, Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const MAROON      = '#570439'
const MAROON_DARK = '#570439'
const GOLD        = '#C9A84C'

const NAV = [
  { label: 'Dashboard',  path: '/dashboard/admin',          icon: LayoutDashboard, exact: true  },
  { label: 'Products',   path: '/dashboard/admin/products', icon: Package,         exact: false },
  { label: 'Branches',   path: '/dashboard/admin/branches', icon: Store,           exact: false },
  { label: 'Users',      path: '/dashboard/admin/users',    icon: Users,           exact: false },
  { label: 'Orders',     path: '/dashboard/admin/orders',   icon: ShoppingBag,     exact: false },
  { label: 'Reports',    path: '/dashboard/admin/reports',  icon: BarChart2,       exact: false },
  { label: 'Settings',   path: '/dashboard/admin/settings', icon: Settings,        exact: false },
]

interface Props {
  user: any
  children: React.ReactNode
  logoUrl?: string | null
}

function MalabarLogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" stroke="white" strokeWidth="1.5" />
      <text x="30" y="21" textAnchor="middle" fill="white" fontSize="7.5"
        fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="1.5">MALABAR</text>
      <line x1="12" y1="24" x2="48" y2="24" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
      <text x="30" y="38" textAnchor="middle" fill="white" fontSize="18"
        fontFamily="Georgia, serif" fontWeight="700">M</text>
      <line x1="12" y1="41" x2="48" y2="41" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
      <text x="30" y="49" textAnchor="middle" fill="white" fontSize="5"
        fontFamily="Arial, sans-serif" letterSpacing="0.8">GOLD &amp; DIAMONDS</text>
    </svg>
  )
}

export default function AdminShell({ user, children, logoUrl }: Props) {
  const pathname    = usePathname()
  const router      = useRouter()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [showProfile, setShowProfile]   = useState(false)
  const [loggingOut, setLoggingOut]     = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const profileRef  = useRef<HTMLDivElement>(null)

  const company  = Array.isArray(user.company) ? user.company[0] : user.company
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    async function fetchUnread() {
      const supabase = createClient()
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
  }, [user.id])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
  }

  function isActive(path: string, exact: boolean) {
    return exact ? pathname === path : pathname.startsWith(path)
  }

  function NavItem({ label, path, icon: Icon, exact }: typeof NAV[0]) {
    const active = isActive(path, exact)
    return (
      <div className="relative">
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full" style={{ backgroundColor: GOLD }} />
        )}
        <Link
          href={path}
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 pl-5 pr-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all"
          style={active
            ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.1)' }
            : { color: 'rgba(255,255,255,0.55)' }
          }
        >
          <Icon className="w-4 h-4 shrink-0" style={{ color: active ? GOLD : undefined }} />
          {label}
        </Link>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: MAROON_DARK }}>

      {/* Admin badge */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Role</p>
            <p className="text-sm font-bold text-white">Administrator</p>
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-1 truncate">{company?.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold tracking-widest uppercase px-5 mb-2"
          style={{ color: 'rgba(255,255,255,0.3)' }}>Menu</p>
        {NAV.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* Help */}
      <div className="px-3 pb-2">
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <Headphones className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <p className="text-sm font-bold text-white">Need help?</p>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Tap Support any time</p>
        </div>
      </div>

      {/* User + logout */}
      <div className="border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-black"
            style={{ backgroundColor: GOLD }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[10px] text-white/40">Admin</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} title="Logout"
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors">
            {loggingOut
              ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Powered by&nbsp;<span style={{ color: GOLD }} className="font-semibold">Orzen Flow</span>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Malabar Top Bar ── */}
      <header
        className="h-16 flex items-center px-4 sm:px-6 gap-3 fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: MAROON }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors mr-1 shrink-0"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Logo */}
        <div className="shrink-0">
          {logoUrl
            ? <img src={logoUrl} alt="Malabar" className="h-11 w-auto object-contain max-w-[200px] sm:max-w-[300px]" />
            : <MalabarLogoMark size={40} />
          }
        </div>

        <div className="flex-1" />

        {/* Bell */}
        <Link href="/dashboard/admin/notifications"
          className="relative p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0">
          <Bell className="w-5 h-5 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        <div ref={profileRef} className="relative shrink-0">
          <button onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: GOLD, color: '#000' }}>
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/60 hidden sm:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
                <p className="text-xs text-gray-400 mt-0.5">{company?.name}</p>
              </div>
              <div className="py-1">
                <Link href="/dashboard/admin/settings" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" /> Settings
                </Link>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button onClick={handleLogout} disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-16">

        {/* Desktop sidebar */}
        <aside className="w-56 fixed top-16 bottom-0 left-0 z-40 hidden lg:flex flex-col shadow-lg">
          <SidebarContent />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Mobile drawer */}
        <aside className={`fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col shadow-2xl lg:hidden transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-16 flex items-center justify-between px-4 shrink-0" style={{ backgroundColor: MAROON }}>
            {logoUrl
              ? <img src={logoUrl} alt="Malabar" className="h-10 w-auto object-contain" />
              : <MalabarLogoMark size={34} />
            }
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-56 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
