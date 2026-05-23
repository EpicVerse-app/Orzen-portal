import { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  submitted:  { label: 'In Approval', bg: '#ede9f8', color: '#6d3fc0' },
  approved:   { label: 'In Approval', bg: '#ede9f8', color: '#6d3fc0' },
  rejected:   { label: 'Rejected',    bg: '#fee2e2', color: '#b91c1c' },
  packing:    { label: 'Packing',     bg: '#dbeafe', color: '#1d4ed8' },
  loaded:     { label: 'In Transit',  bg: '#fef9c3', color: '#a16207' },
  shipped:    { label: 'Dispatched',  bg: '#ffedd5', color: '#c2410c' },
  delivered:  { label: 'Delivered',   bg: '#dcfce7', color: '#15803d' },
  closed:     { label: 'Closed',      bg: '#f3f4f6', color: '#6b7280' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
