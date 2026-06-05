'use client'

import { useState, useEffect } from 'react'
import { loginAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [currentUser, setCurrentUser]   = useState<{ name: string; role: string } | null>(null)

  // Check if someone is already signed in
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
      if (profile) {
        setCurrentUser({
          name: profile.full_name,
          role: profile.role.replace('_', ' '),
        })
      }
    }
    checkSession()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const error = await loginAction(username, password)
    if (error) {
      toast.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Already signed in banner */}
        {currentUser && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
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
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-[#c9a84c] text-xl font-bold tracking-wide">OF</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Orzen Flow</h1>
            <p className="text-sm text-gray-500 mt-1">
              {currentUser ? 'Sign in as a different account' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Access is provided by your company administrator
        </p>
      </div>
    </div>
  )
}
