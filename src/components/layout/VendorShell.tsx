'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, LayoutDashboard, Bell, LogOut,
  ChevronDown, Headphones,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const MAROON      = '#570439'
const MAROON_DARK = '#570439'
const GOLD        = '#C9A84C'

function MalabarLogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" stroke="white" strokeWidth="1.5" />
      {/* MALABAR */}
      <text x="30" y="21" textAnchor="middle" fill="white" fontSize="7.5"
        fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="1.5">MALABAR</text>
      {/* divider line */}
      <line x1="12" y1="24" x2="48" y2="24" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
      {/* M */}
      <text x="30" y="38" textAnchor="middle" fill="white" fontSize="18"
        fontFamily="Georgia, serif" fontWeight="700">M</text>
      {/* divider line */}
      <line x1="12" y1="41" x2="48" y2="41" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
      {/* GOLD & DIAMONDS */}
      <text x="30" y="49" textAnchor="middle" fill="white" fontSize="5"
        fontFamily="Arial, sans-serif" letterSpacing="0.8">GOLD &amp; DIAMONDS</text>
    </svg>
  )
}

interface Props {
  user: any
  children: React.ReactNode
  primaryColor?: string
  sidebarColor?: string
  logoUrl?: string | null
}

export default function VendorShell({ user, children, primaryColor, sidebarColor, logoUrl }: Props) {
  const pathname    = usePathname()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [showProfile, setShowProfile]   = useState(false)
  const [showNotifs,  setShowNotifs]    = useState(false)
  const [loggingOut,  setLoggingOut]    = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [bellRing,    setBellRing]      = useState(false)
  const profileRef  = useRef<HTMLDivElement>(null)
  const notifRef    = useRef<HTMLDivElement>(null)

  const sidebarBg = MAROON_DARK
  const gold      = GOLD

  const company  = Array.isArray(user.company) ? user.company[0] : user.company
  const initials = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Fetch unread + bell shake
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

  const NAV = [
    { href: '/dashboard/vendor',               label: 'Dashboard',     icon: LayoutDashboard, exact: true,  badge: 0 },
    { href: '/dashboard/vendor/notifications',  label: 'Notifications', icon: Bell,            exact: false, badge: unreadCount },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Malabar Top Brand Header ── */}
      <header
        className="h-14 flex items-center px-4 sm:px-6 gap-3 fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: MAROON }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors mr-1 shrink-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Logo */}
        <div className="flex items-center shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Malabar" className="h-11 w-auto object-contain max-w-[200px] sm:max-w-[280px]" />
          ) : (
            <MalabarLogoMark size={38} />
          )}
        </div>

        <div className="flex-1" />

        {/* Notification bell */}
        <div ref={notifRef} className="relative shrink-0">
          <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className={`w-5 h-5 text-white/70 ${bellRing ? 'animate-bell' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pulse-ring">
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
                <Link href="/dashboard/vendor/notifications" onClick={() => setShowNotifs(false)}
                  className="text-xs font-semibold hover:underline" style={{ color: '#570439' }}>View all →</Link>
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
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">Vendor</p>
                <p className="text-xs text-gray-400 mt-0.5">{company?.name}</p>
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
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside
          className={`
            w-56 fixed top-14 bottom-0 left-0 z-40 flex flex-col
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ backgroundColor: sidebarBg }}
        >
          <nav className="flex-1 px-2 py-5 overflow-y-auto">
            <p
              className="text-[10px] font-bold tracking-widest uppercase px-3 mb-3"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Menu
            </p>
            <div className="space-y-0.5">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const Icon   = item.icon
                return (
                  <div key={item.href} className="relative">
                    {active && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full"
                        style={{ backgroundColor: gold }}
                      />
                    )}
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={
                        active
                          ? { color: '#fff', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }
                          : { color: 'rgba(255,255,255,0.55)', fontWeight: 500 }
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" style={active ? { color: gold } : {}} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white/20 text-white">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Need help */}
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
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Vendor</p>
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
          {children}
        </main>
      </div>
    </div>
  )
}
