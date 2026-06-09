'use client'

import { AlertCircle, Clock, Truck, CheckCircle } from 'lucide-react'
import AnimatedStatCard from '@/components/ui/AnimatedStatCard'

interface Props {
  pendingCount:   number
  activeCount:    number
  inTransitCount: number
  deliveredCount: number
}

export default function StoreHeadDashboardStats({
  pendingCount, activeCount, inTransitCount, deliveredCount,
}: Props) {
  const STATS = [
    { label: 'Pending Approval', value: pendingCount,   icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50',  href: '/dashboard/store-head/requests'   },
    { label: 'Active Orders',    value: activeCount,    icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50',    href: '/dashboard/store-head/orders'     },
    { label: 'In Transit',       value: inTransitCount, icon: Truck,       color: 'text-purple-600', bg: 'bg-purple-50',  href: '/dashboard/store-head/deliveries' },
    { label: 'Delivered',        value: deliveredCount, icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50',   href: '/dashboard/store-head/orders'     },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATS.map((s, i) => (
        <AnimatedStatCard key={s.label} {...s} index={i} />
      ))}
    </div>
  )
}
