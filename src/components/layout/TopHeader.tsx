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
  onCreateOrder?: () => void
  onMenuToggle: () => void
}

export default function TopHeader({ user, onCreateOrder, onMenuToggle }: Props) {
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

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

  // Focus search input when opened
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

  const initials  = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const company   = Array.isArray(user.company) ? (user.company as any)[0] : user.company as any
  const headerBg  = company?.primary_color || '#1a1a1a'
  const gold      = '#c9a84c'

  return (
    <>
      <header className="text-white h-14 flex items-center px-4 gap-3 fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: headerBg }}>

        {/* Mobile menu toggle */}
        <button className="lg:hidden text-gray-400 hover:text-white" onClick={onMenuToggle}>
          <Menu className="w-5 h-5" />
        </button>

        {/* 1. Logo / Home */}
        <Link
          href="/dashboard/store"
          className="text-sm font-bold tracking-wide shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-[#c9a84c]">ORZEN</span>
          <span className="text-white ml-1 font-light">FLOW</span>
        </Link>

        {/* 2. Global Search — desktop */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex items-center rounded-lg px-3 gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, catalogue..."
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

        {/* 3. Create Order */}
        {onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#b8973b] text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Order</span>
          </button>
        )}

        {/* 4. Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors p-1">
          <Bell className="w-4 h-4" />
          {/* Unread badge — will be dynamic later */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* 5. Help & Support */}
        <button
          onClick={() => setShowHelp(true)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* 6. Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center text-black text-xs font-bold hover:opacity-80 transition-opacity"
          >
            {initials}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(user.company as any)?.name}</p>
              </div>

              {/* Menu items */}
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

              {/* Logout */}
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
        <div className="fixed top-14 left-0 right-0 z-40 bg-[#1a1a1a] px-4 py-3 sm:hidden">
          <form onSubmit={handleSearch} className="flex items-center bg-[#2a2a2a] rounded-lg px-3 gap-2">
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
                <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Contact Support</p>
                  <p className="text-xs text-gray-400">support@kriyora.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-[#c9a84c] rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Your Account</p>
                  <p className="text-xs text-gray-400">{user.full_name} · {(user.company as any)?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
