'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppUser, Order } from '@/types'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  profile: AppUser
  pendingOrders: Order[]
  otherOrders: Order[]
}

export default function SuperManagerDashboard({ profile, pendingOrders, otherOrders }: Props) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)

  async function handleApproval(orderId: string, action: 'approved' | 'rejected') {
    setProcessing(orderId)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        status: action,
        approved_by: profile.id,
        approved_by_role: profile.role,
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Action failed. Try again.')
    } else {
      toast.success(action === 'approved' ? 'Order approved' : 'Order rejected')
      router.refresh()
    }
    setProcessing(null)
  }

  function getDaysAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{(profile.company as any)?.name}</p>
            <h1 className="text-lg font-semibold text-gray-900">{profile.full_name}</h1>
            <p className="text-xs text-gray-400">{profile.scope_state} · Super Manager</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm font-semibold">
              {profile.full_name?.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Pending Approvals */}
        {pendingOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-orange-700">
                Pending Approvals ({pendingOrders.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingOrders.map((order) => (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {(order.branch as any)?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(order.branch as any)?.city} · {(order.items as any)?.length} items · {getDaysAgo(order.created_at)}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(order.id, 'rejected')}
                      disabled={processing === order.id}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(order.id, 'approved')}
                      disabled={processing === order.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              All Orders — {profile.scope_state}
            </h2>
          </div>
          {otherOrders.length === 0 && pendingOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No orders yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {otherOrders.map((order) => (
                <div key={order.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {(order.branch as any)?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(order.branch as any)?.city} · {getDaysAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
