'use client'

import { useState, useEffect, useRef } from 'react'
import { loginAction, getUsersForDropdown } from './actions'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react'

const LOGO_URL =
  'https://muaqpangtwibnlmtjahn.supabase.co/storage/v1/object/sign/Orzen%20Flow/Flow_MO_Logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzBlM2JiYS01Nzg5LTRmNDQtOTMyNS00OTA1MGY3NWFlYjYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPcnplbiBGbG93L0Zsb3dfTU9fTG9nby5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzgyMTA0NjE0LCJleHAiOjIwOTc0NjQ2MTR9.WfiVGt2DVztlw5tjOy3apaurcFwFY4l0LOK2diA9cvg'

const ROLE_LABEL: Record<string, string> = {
  admin:         'Super Admin',
  super_manager: 'RV Manager',
  store_head:    'Store Head',
  store_manager: 'Store ID',
  vendor:        'Vendor',
}

export default function LoginPage() {
  const [username, setUsername]           = useState('')
  const [password, setPassword]           = useState('')
  const [loading, setLoading]             = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [currentUser, setCurrentUser]     = useState<{ name: string; role: string } | null>(null)

  const [users, setUsers]                 = useState<{ username: string; full_name: string; role: string }[]>([])
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [search, setSearch]               = useState('')
  const dropdownRef                       = useRef<HTMLDivElement>(null)

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
    }
  }

  const selectedUser = users.find(u => u.username === username)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #8D6736 0%, #C9A84C 40%, #D4B276 70%, #B18850 100%)' }}
    >
      <div className="w-full max-w-4xl">

        {/* Already signed in banner */}
        {currentUser && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(18,18,21,0.7)', border: '1px solid #B18850' }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: '#D4B276' }}>Currently signed in as</p>
              <p className="text-sm font-bold" style={{ color: '#EFE1B5' }}>{currentUser.name}</p>
              <p className="text-xs capitalize" style={{ color: '#B18850' }}>{currentUser.role}</p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#B18850', color: '#121215' }}
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Main card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#121215' }}
        >
          <div className="flex flex-col md:flex-row min-h-[480px]">

            {/* Left — Logo */}
            <div className="flex-1 flex items-center justify-center p-10 md:p-14">
              <Image
                src={LOGO_URL}
                alt="Orzen Flow"
                width={300}
                height={300}
                className="object-contain w-full max-w-[260px] md:max-w-[300px]"
                unoptimized
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px my-12" style={{ backgroundColor: '#2a2a2a' }} />

            {/* Right — Form */}
            <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-12">
              <p className="text-center text-sm mb-7" style={{ color: '#D4B276' }}>
                Sign in to your account
              </p>

              <form onSubmit={handleLogin} className="space-y-4">

                {/* Select User dropdown */}
                {users.length > 0 && (
                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#D4B276' }}>
                      Select User
                    </label>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(v => !v)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between transition-all"
                      style={{
                        backgroundColor: '#EFE1B5',
                        border: '1px solid #B18850',
                        color: selectedUser ? '#121215' : '#8D6736',
                      }}
                    >
                      <span>
                        {selectedUser
                          ? `${selectedUser.full_name} - ${ROLE_LABEL[selectedUser.role] ?? selectedUser.role}`
                          : 'Select a user...'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform shrink-0 ml-2`}
                        style={{ color: '#8D6736', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute z-50 mt-1 w-full rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col"
                        style={{ backgroundColor: '#EFE1B5', border: '1px solid #B18850' }}
                      >
                        <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #D4B276' }}>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8D6736' }} />
                            <input
                              type="text"
                              placeholder="Search..."
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                              autoFocus
                              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg focus:outline-none"
                              style={{
                                backgroundColor: '#fff',
                                border: '1px solid #D4B276',
                                color: '#121215',
                              }}
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto">
                          {filtered.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-center" style={{ color: '#8D6736' }}>No users found</div>
                          ) : (
                            filtered.map(u => (
                              <button
                                key={u.username}
                                type="button"
                                onClick={() => { setUsername(u.username); setDropdownOpen(false); setSearch('') }}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                                style={{
                                  backgroundColor: u.username === username ? '#D4B276' : 'transparent',
                                  color: '#121215',
                                }}
                                onMouseEnter={e => { if (u.username !== username) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D4B27640' }}
                                onMouseLeave={e => { if (u.username !== username) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                              >
                                <span className="text-sm font-medium">{u.full_name}</span>
                                <span className="text-xs ml-2 shrink-0" style={{ color: '#8D6736' }}>
                                  {ROLE_LABEL[u.role] ?? u.role}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#D4B276' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: '#EFE1B5',
                      border: '1px solid #B18850',
                      color: '#121215',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#D4B276')}
                    onBlur={e => (e.target.style.borderColor = '#B18850')}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#D4B276' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none transition-all"
                      style={{
                        backgroundColor: '#EFE1B5',
                        border: '1px solid #B18850',
                        color: '#121215',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#D4B276')}
                      onBlur={e => (e.target.style.borderColor = '#B18850')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                      style={{ color: '#8D6736' }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #B18850 0%, #D4B276 100%)',
                    color: '#121215',
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-5" style={{ color: '#EFE1B5' }}>
          Access is provided by your company administrator
        </p>
      </div>
    </div>
  )
}
