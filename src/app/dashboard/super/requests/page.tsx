'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Package, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendOrderNotifications } from '@/app/actions/notifications'

interface OrderItem {
  id: string
  quantity: number
  product: { id: string; name: string; unit: string; image_url: string | null }
}

interface Order {
  id: string
  status: string
  created_at: string
  branch: { id: string; name: string; city: string; state: string }
  items: OrderItem[]
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}

function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1)  return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function SuperRequestsPage() {
  const [orders, setOrders]       = useState<Order[]>([])
  const [profile, setProfile]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('users')
        .select('id, role, company_id')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'super_manager') return
      setProfile(prof)

      const { data } = await supabase
        .from('orders')
        .select(`
          id, status, created_at,
          branch:branches(id, name, city, state),
          items:order_items(id, quantity, product:products(id, name, unit, image_url))
        `)
        .eq('company_id', prof.company_id)
        .eq('status', 'submitted')
        .order('created_at', { ascending: true })

      setOrders((data || []) as any)
      setLoading(false)
    }
    load()
  }, [])

  async function handleApproval(orderId: string, action: 'approved' | 'rejected') {
    if (!profile) return
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

      // Notify vendor + store manager via server action
      const order = orders.find(o => o.id === orderId)
      if (order) {
        const sid = 'ORD-' + orderId.replace(/-/g, '').slice(0, 6).toUpperCase()
        await sendOrderNotifications({
          orderId,
          companyId:   profile.company_id,
          title:       action === 'approved' ? 'Order Approved' : 'Order Rejected',
          message:     `Order ${sid} has been ${action}`,
          type:        `order_${action}`,
          targetRoles: ['vendor', 'store_manager'],
          branchId:    order.branch?.id,
        })
      }

      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {orders.length === 0
              ? 'No pending requests'
              : `${orders.length} request${orders.length !== 1 ? 's' : ''} awaiting your approval`}
          </p>
        </div>
        {orders.length > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-600">
            {orders.length} pending
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
          <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-4" />
          <p className="text-base font-semibold text-gray-600">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No requests are waiting for approval</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 bg-orange-50/60 border-b border-orange-100 flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">{order.branch?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.branch?.city}, {order.branch?.state}
                    {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    {' · '}{timeAgo(order.created_at)}
                  </p>
                  <p className="text-[10px] font-mono text-gray-300 mt-1">{shortId(order.id)}</p>
                </div>
                <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              </div>

              {/* Product list */}
              <div className="divide-y divide-gray-50">
                {order.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">{item.product?.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 shrink-0">
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="px-5 py-4 flex gap-3 border-t border-gray-50">
                <button
                  onClick={() => handleApproval(order.id, 'rejected')}
                  disabled={processing === order.id}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproval(order.id, 'approved')}
                  disabled={processing === order.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
