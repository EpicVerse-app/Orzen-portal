'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ClipboardList, Truck,
  Bell, Menu, X, LogOut, ShieldCheck, Headphones,
} from 'lucide-react'
import { AppUser } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const MAROON      = '#5C1030'
const MAROON_DARK = '#470C25'
const GOLD        = '#C9A84C'

const NAV = [
  { label: 'Dashboard',  path: '/dashboard/store-head',            icon: LayoutDashboard, exact: true  },
  { label: 'Requests',   path: '/dashboard/store-head/requests',   icon: Package,         exact: false },
  { label: 'Orders',     path: '/dashboard/store-head/orders',     icon: ClipboardList,   exact: false },
  { label: 'Deliveries', path: '/dashboard/store-head/deliveries', icon: Truck,           exact: false },
]

function MalabarLogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" />
      <text x="24" y="20" textAnchor="middle" fill="white" fontSize="7" fontFamily="Georgia, serif" fontWeight="bold" letterSpacing="0.5">MALABAR</text>
      <text x="24" y="29" textAnchor="middle" fill="white" fontSize="14" fontFamily="Georgia, serif" fontWeight="bold">M</text>
      <text x="24" y="37.5" textAnchor="middle" fill="white" fontSize="4.5" fontFamily="Georgia, serif" letterSpacing="0.3">GOLD &amp; DIAMONDS</text>
    </svg>
  )
}

interface Props {
  user: AppUser
  children: React.ReactNode
  primaryColor?: string
  sidebarColor?: string
  logoUrl?: string | null
}

export default function StoreHeadShell({ user, children, logoUrl }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  const branch = (user as any).branch

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
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full" style={{ backgroundColor: GOLD }} />
        )}
        <Link
          href={path}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 pl-5 pr-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all ${
            active ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
          style={active ? { backgroundColor: 'rgba(255,255,255,0.1)', fontWeight: 600 } : {}}
        >
          <Icon className="w-4 h-4 shrink-0" style={{ color: active ? GOLD : undefined }} />
          {label}
        </Link>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: MAROON_DARK }}>

      {/* Branch info */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Branch</p>
        <p className="text-sm font-bold text-white truncate">
          {branch?.name || 'No branch assigned'}
        </p>
        <p className="text-[11px] text-white/50 truncate mt-0.5">
          {branch?.city}{branch?.state ? `, ${branch.state}` : ''}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold tracking-widest uppercase px-5 mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Menu
        </p>
        {NAV.map(item => <NavItem key={item.path} {...item} />)}
      </nav>

      {/* Help card */}
      <div className="px-3 pb-2">
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-2 mb-0.5">
            <Headphones className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <p className="text-sm font-bold text-white">Need help?</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tap Support any time
          </p>
        </div>
      </div>

      {/* User + logout */}
      <div className="border-t border-white/10 px-3 py-3 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-black" style={{ backgroundColor: GOLD }}>
            {user.full_name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
            <p className="text-[10px] text-white/40">Store Head</p>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} title="Logout"
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors">
            {loggingOut
              ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Powered by */}
      <div className="px-4 py-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Powered by&nbsp;
          <span style={{ color: GOLD }} className="font-semibold">Orzen Flow</span>
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Malabar Top Brand Header (fixed, full-width) ── */}
      <header
        className="h-14 flex items-center px-4 sm:px-6 gap-3 fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: MAROON }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors mr-1 shrink-0"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Logo + brand */}
        <div className="flex items-center gap-3 shrink-0">
          {logoUrl
            ? <img src={logoUrl} alt="Malabar" className="h-9 object-contain" />
            : <MalabarLogoMark size={38} />
          }
          <div className="w-px h-7 bg-white/25 mx-1" />
          <div>
            <p className="text-white text-[11px] font-semibold tracking-[0.18em] uppercase leading-none">
              Visual Merchandising
            </p>
            <p className="text-[9px] tracking-[0.12em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Store Head Portal
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Branch pill (desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border"
          style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
          {branch?.name || 'Store Head'}
        </div>

        {/* Bell */}
        <Link href="/dashboard/store-head/notifications"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0">
          <Bell className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
        </Link>
      </header>

      <div className="flex flex-1 pt-14">

        {/* Desktop sidebar */}
        <aside className="w-56 fixed top-14 bottom-0 left-0 z-40 hidden lg:flex flex-col shadow-lg">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-56 z-50 flex flex-col shadow-2xl lg:hidden transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mini header in mobile drawer */}
          <div className="h-14 flex items-center justify-between px-4 shrink-0" style={{ backgroundColor: MAROON }}>
            <MalabarLogoMark size={34} />
            <button onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
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
