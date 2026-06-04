'use client'

import { useState } from 'react'
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  Package, TrendingUp, Building2, Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppUser, Order } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
  branches: number
}

interface Props {
  profile: AppUser
  pendingOrders: Order[]
  recentActivity: Order[]
  stats: Stats
}

// Format order ID as ORD-XXXX
function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

// Format timestamp as "10:45 AM" or "Yesterday 10:45 AM"
function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now  = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (isToday)     return time
  if (isYesterday) return `Yesterday ${time}`
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' ' + time
}

// Turn an order into a readable activity line
function activityLine(order: Order) {
  const branch = (order.branch as any)?.name || 'Branch'
  const id     = shortId(order.id)
  switch (order.status) {
    case 'submitted':  return `Order ${id} submitted by ${branch}`
    case 'approved':   return `Order ${id} approved`
    case 'rejected':   return `Order ${id} rejected`
    case 'packing':    return `Order ${id} is being packed`
    case 'loaded':     return `Order ${id} loaded for delivery`
    case 'shipped':    return `Order ${id} shipped to ${branch}`
    case 'delivered':  return `Order ${id} delivered to ${branch}`
    default:           return `Order ${id} updated`
  }
}

// Dot color per status
function activityDot(status: string) {
  switch (status) {
    case 'submitted': return 'bg-orange-400'
    case 'approved':  return 'bg-green-500'
    case 'rejected':  return 'bg-red-400'
    case 'packing':   return 'bg-blue-400'
    case 'loaded':
    case 'shipped':   return 'bg-indigo-400'
    case 'delivered': return 'bg-emerald-500'
    default:          return 'bg-gray-400'
  }
}

export default function SuperManagerDashboard({ profile, pendingOrders, recentActivity, stats }: Props) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)

  async function handleApproval(orderId: string, action: 'approved' | 'rejected') {
    setProcessing(orderId)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: action, approved_by: profile.id, approved_by_role: profile.role })
      .eq('id', orderId)

    if (error) {
      toast.error('Action failed. Try again.')
    } else {
      toast.success(action === 'approved' ? 'Order approved ✓' : 'Order rejected')
      router.refresh()
    }
    setProcessing(null)
  }

  function getDaysAgo(date: string) {
    const diff  = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1)  return 'just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="px-4 sm:px-6 py-5 space-y-6 max-w-6xl mx-auto">

      {/* ── Greeting ─────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {profile.scope_state} Region · {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-xs text-gray-400">Total Orders</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-400">Approved</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            <p className="text-xs text-gray-400">Rejected</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-4 py-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.branches}</p>
            <p className="text-xs text-gray-400">Branches</p>
          </div>
        </div>
      </div>

      {/* ── Main Grid: Approvals + Activity ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-700 flex-1">
              Pending Approvals
            </h2>
            {pendingOrders.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                {pendingOrders.length}
              </span>
            )}
          </div>

          {pendingOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[420px]">
              {pendingOrders.map((order) => (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {(order.branch as any)?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(order.branch as any)?.city}
                        {(order.items as any)?.length
                          ? ` · ${(order.items as any).length} items`
                          : ''}
                        {' · '}{getDaysAgo(order.created_at)}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-0.5 font-mono">{shortId(order.id)}</p>
                    </div>
                    <Clock className="w-4 h-4 text-orange-300 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApproval(order.id, 'rejected')}
                      disabled={processing === order.id}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(order.id, 'approved')}
                      disabled={processing === order.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[420px]">
              <div className="px-5 py-3 space-y-0">
                {recentActivity.map((order, i) => (
                  <div key={order.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${activityDot(order.status)}`} />
                      {i < recentActivity.length - 1 && (
                        <span className="w-px flex-1 bg-gray-100 mt-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 pb-1">
                      <p className="text-xs text-gray-700 leading-snug">
                        {activityLine(order)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
