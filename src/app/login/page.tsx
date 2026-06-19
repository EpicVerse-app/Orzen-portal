'use client'

import { useState, useEffect, useRef } from 'react'
import { m as motion, AnimatePresence } from 'framer-motion'
import { loginAction, getUsersForDropdown } from './actions'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
  admin:         'Super Admin',
  super_manager: 'RV Manager',
  store_head:    'Store Head',
  store_manager: 'Store ID',
  vendor:        'Vendor',
}

export default function LoginPage() {
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [shake, setShake]             = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null)

  const [users, setUsers]             = useState<{ username: string; full_name: string; role: string }[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch]           = useState('')
  const dropdownRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      if (profile) setCurrentUser({ name: profile.full_name, role: profile.role.replace('_', ' ') })
    }
    checkSession()
    getUsersForDropdown().then(setUsers)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    ROLE_LABEL[u.role]?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const error = await loginAction(username, password)
    if (error) {
      toast.error(error)
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Already signed in banner */}
        <AnimatePresence>
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-semibold text-amber-800">Currently signed in as</p>
                <p className="text-sm font-bold text-amber-900">{currentUser.name}</p>
                <p className="text-xs text-amber-700 capitalize">{currentUser.role}</p>
              </div>
              <Link
                href="/dashboard"
                className="shrink-0 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-xl transition-colors"
              >
                Go to Dashboard →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          animate-x={shake ? [0, -8, 8, -8, 8, 0] : 0}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          style={shake ? { animation: 'shake 0.5s ease' } : {}}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.35, ease: 'backOut' }}
            className="mb-8 text-center"
          >
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-[#c9a84c] text-xl font-bold tracking-wide">OF</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Orzen Flow</h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentUser ? 'Sign in as a different account' : 'Sign in to your account'}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            {/* User selector dropdown */}
            {users.length > 0 && (
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(v => !v)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-left flex items-center justify-between bg-white hover:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-shadow"
                >
                  <span className={username ? 'text-gray-900' : 'text-gray-400'}>
                    {username
                      ? (() => { const u = users.find(u => u.username === username); return u ? `${ROLE_LABEL[u.role] ?? u.role} — ${u.full_name}` : username })()
                      : 'Select a user…'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 flex flex-col">
                    <div className="p-2 border-b border-gray-100 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search…"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/40"
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">No users found</div>
                      ) : (
                        filtered.map(u => (
                          <button
                            key={u.username}
                            type="button"
                            onClick={() => { setUsername(u.username); setDropdownOpen(false); setSearch('') }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${u.username === username ? 'bg-[#f5f0e8]' : ''}`}
                          >
                            <span className="text-xs text-gray-400">{u.full_name}</span>
                            <span className="text-sm font-semibold text-gray-800 ml-2 shrink-0">{ROLE_LABEL[u.role] ?? u.role}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </motion.button>
          </motion.form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          Access is provided by your company administrator
        </motion.p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
