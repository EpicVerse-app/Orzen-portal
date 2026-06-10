'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle, XCircle, Package, Truck, Clock, ChevronRight } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  order_id: string | null
}

const TYPE_ICON: Record<string, React.ElementType> = {
  order_submitted: Clock,
  order_approved:  CheckCircle,
  order_rejected:  XCircle,
  order_packing:   Package,
  order_loaded:    Truck,
  order_shipped:   Truck,
  order_delivered: CheckCircle,
}

const TYPE_COLOR: Record<string, string> = {
  order_submitted: 'bg-orange-100 text-orange-600',
  order_approved:  'bg-green-100 text-green-600',
  order_rejected:  'bg-red-100 text-red-600',
  order_packing:   'bg-blue-100 text-blue-600',
  order_loaded:    'bg-blue-100 text-blue-600',
  order_shipped:   'bg-purple-100 text-purple-600',
  order_delivered: 'bg-green-100 text-green-600',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StoreNotificationsPage() {
  const [notifs, setNotifs]   = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at, order_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifs((data || []) as Notification[])
      setLoading(false)

      const unreadIds = (data || []).filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    load()
  }, [])

  function NotifCard({ n }: { n: Notification }) {
    const Icon  = TYPE_ICON[n.type]  || Bell
    const color = TYPE_COLOR[n.type] || 'bg-gray-100 text-gray-500'
    const inner = (
      <div className={`bg-white rounded-2xl border shadow-sm px-4 py-4 flex items-start gap-3 transition-all ${
        !n.is_read ? 'border-purple-100 bg-purple-50/30' : 'border-gray-100'
      } ${n.order_id ? 'hover:border-gray-300 hover:shadow-md active:scale-[0.99] cursor-pointer' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
              {n.title}
            </p>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-500" />}
              {n.order_id && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
            </div>
          </div>
          {n.message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>}
          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
        </div>
      </div>
    )
    if (n.order_id) {
      return <Link href={`/dashboard/store/orders/${n.order_id}`}>{inner}</Link>
    }
    return inner
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">Approvals and delivery updates for your orders</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-2 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">Approvals and delivery updates will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => <NotifCard key={n.id} n={n} />)}
        </div>
      )}
    </div>
  )
}
