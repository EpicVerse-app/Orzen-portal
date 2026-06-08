'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'
import { Calendar, MapPin } from 'lucide-react'

interface Props {
  shortOrderId: string
  branchName?: string
  branchCity?: string
  date: string
  status: string
  itemCount: number
  totalQty: number
  defaultOpen?: boolean
  children: React.ReactNode   // expanded: product list + photos + actions
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderAccordionCard({
  shortOrderId, branchName, branchCity, date, status,
  itemCount, totalQty, defaultOpen = false, children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Collapsed header — always visible ───────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 text-left hover:bg-gray-50/60 transition-colors"
      >
        {/* Left: IDs + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{shortOrderId}</span>
            {branchName && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                <MapPin className="w-3 h-3 text-gray-400" />
                {branchName}{branchCity ? `, ${branchCity}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />{fmtDate(date)}
            </span>
            <span className="text-xs text-gray-400">
              {itemCount} product{itemCount !== 1 ? 's' : ''} · {totalQty} items
            </span>
          </div>
        </div>

        {/* Right: status + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={status as any} />
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Expanded content ─────────────────────────────────── */}
      {open && (
        <div className="border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}
