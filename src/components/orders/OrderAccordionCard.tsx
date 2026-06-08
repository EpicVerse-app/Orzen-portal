'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { ChevronDown, MapPin, Calendar } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

interface Props {
  shortOrderId: string
  branchName?: string
  branchCity?: string
  date: string
  status: string
  itemCount: number
  totalQty: number
  defaultOpen?: boolean
  children: React.ReactNode
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
    <m.div
      layout="position"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      whileHover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Collapsed header ─────────────────────────────── */}
      <m.button
        onClick={() => setOpen(o => !o)}
        whileTap={{ scale: 0.995 }}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 text-left hover:bg-gray-50/60 active:bg-gray-100/60 transition-colors min-h-[60px]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{shortOrderId}</span>
            {branchName && (
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                {branchName}{branchCity ? `, ${branchCity}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3 shrink-0" />{fmtDate(date)}
            </span>
            <span className="text-xs text-gray-400">
              {itemCount} product{itemCount !== 1 ? 's' : ''} · {totalQty} items
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge status={status as any} />
          <m.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </m.div>
        </div>
      </m.button>

      {/* ── Animated expand ───────────────────────────────── */}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-gray-100">
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
