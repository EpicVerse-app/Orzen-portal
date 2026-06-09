'use client'

import { Store, Users, ShoppingBag, Clock, Truck, CheckCircle } from 'lucide-react'
import AnimatedStatCard from '@/components/ui/AnimatedStatCard'

interface Props {
  branchCount:    number
  userCount:      number
  orderTotal:     number
  orderPending:   number
  orderShipped:   number
  orderDelivered: number
}

export default function AdminDashboardStats({
  branchCount, userCount, orderTotal, orderPending, orderShipped, orderDelivered,
}: Props) {
  const STATS = [
    { label: 'Total Branches',   value: branchCount,    icon: Store,        href: '/dashboard/admin/branches', color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Total Users',      value: userCount,      icon: Users,        href: '/dashboard/admin/users',    color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'All Orders',       value: orderTotal,     icon: ShoppingBag,  href: '/dashboard/admin/orders',   color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pending Approval', value: orderPending,   icon: Clock,        href: '/dashboard/admin/orders',   color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'In Transit',       value: orderShipped,   icon: Truck,        href: '/dashboard/admin/orders',   color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Delivered',        value: orderDelivered, icon: CheckCircle,  href: '/dashboard/admin/orders',   color: 'text-green-600',  bg: 'bg-green-50'  },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STATS.map((s, i) => (
        <AnimatedStatCard key={s.label} {...s} index={i} />
      ))}
    </div>
  )
}
