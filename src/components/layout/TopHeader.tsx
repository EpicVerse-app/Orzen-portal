'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, HelpCircle, User, Plus, Search, X, LogOut, Settings, Store, Menu } from 'lucide-react'
import { AppUser } from '@/types'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  user: AppUser
  onMenuToggle: () => void
  headerColor?: string
}

export default function TopHeader({ user, onMenuToggle, headerColor }: Props) {
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Logged out')
    window.location.href = '/login'
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/dashboard/store/orders?search=${encodeURIComponent(searchQuery)}`)
    setShowSearch(false)
    setSearchQuery('')
  }

  const companyName = (Array.isArray(user.company) ? (user.company as any)[0] : user.company as any)?.name || 'Orzen Flow'
  // Split company name into up to 2 lines for display
  const words       = companyName.trim().split(' ')
  const line1       = words[0] || ''
  const line2       = words.slice(1).join(' ')

  const initials  = user.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const headerBg  = headerColor || '#1a1a1a'
  const gold      = '#c9a84c'

  return (
    <>
      <header
        className="text-white h-14 flex items-center px-4 gap-3 fixed top-0 left-0 right-0 z-50 relative"
        style={{ backgroundColor: headerBg }}
      >
        {/* Mobile menu toggle */}
        <button className="lg:hidden text-gray-300 hover:text-white" onClick={onMenuToggle}>
          <Menu className="w-5 h-5" />
        </button>

        {/* Company name / logo */}
        <Link
          href="/dashboard/store"
          className="shrink-0 hover:opacity-80 transition-opacity leading-tight"
        >
          <p className="text-sm font-extrabold tracking-widest uppercase leading-none" style={{ color: gold }}>
            {line1}
          </p>
          {line2 && (
            <p className="text-sm font-extrabold tracking-widest uppercase leading-none mt-0.5" style={{ color: '#ffffff' }}>
              {line2}
            </p>
          )}
        </Link>

        {/* Global search — centered absolutely on desktop */}
        <form
          onSubmit={handleSearch}
          className="absolute left-1/2 -translate-x-1/2 w-[380px] hidden sm:flex items-center rounded-lg px-3 gap-2 pointer-events-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders & materials..."
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full py-2"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}>
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
            </button>
          )}
        </form>

        {/* Mobile search toggle */}
        <button className="sm:hidden text-gray-400 hover:text-white" onClick={() => setShowSearch(!showSearch)}>
          <Search className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* New Order */}
        <Link
          href="/dashboard/store/catalogue"
          className="flex items-center gap-1.5 text-black text-xs font-bold px-4 py-2 rounded-lg transition-opacity shrink-0 hover:opacity-90"
          style={{ backgroundColor: gold }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Order</span>
        </Link>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors p-1">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <User className="w-4 h-4 text-white" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{companyName}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard/store/profile"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/store"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Store className="w-4 h-4 text-gray-400" />
                  Store Details
                </Link>
                <Link
                  href="/dashboard/store/settings"
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
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="fixed top-14 left-0 right-0 z-40 px-4 py-3 sm:hidden" style={{ backgroundColor: headerBg }}>
          <form onSubmit={handleSearch} className="flex items-center rounded-lg px-3 gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, catalogue..."
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full py-2.5"
            />
            <button type="button" onClick={() => setShowSearch(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </form>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Help & Support</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <a href="mailto:support@kriyora.com" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: gold }}>
                  <HelpCircle className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Contact Support</p>
                  <p className="text-xs text-gray-400">support@kriyora.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: gold }}>
                  <User className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Your Account</p>
                  <p className="text-xs text-gray-400">{user.full_name} · {companyName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
