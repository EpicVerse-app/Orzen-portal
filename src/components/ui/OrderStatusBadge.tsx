import { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  submitted:  { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700' },
  approved:   { label: 'Approved',  className: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  packing:    { label: 'Packing',   className: 'bg-blue-100 text-blue-700' },
  loaded:     { label: 'Loaded',    className: 'bg-indigo-100 text-indigo-700' },
  shipped:    { label: 'Shipped',   className: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Delivered', className: 'bg-teal-100 text-teal-700' },
  closed:     { label: 'Closed',    className: 'bg-gray-100 text-gray-600' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  )
}
