'use client'

import Link from 'next/link'
import { ChevronLeft, MapPin, Store, TrendingUp, Package, Truck, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

interface Branch {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
}

interface Order {
  id: string
  status: string
  created_at: string
  branch: Branch
}

interface Props {
  orders: Order[]
}

function shortId(id: string) {
  return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase()
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_COLOR: Record<string, string> = {
  approved:  'text-blue-600',
  shipped:   'text-purple-600',
  delivered: 'text-green-600',
}

export default function VendorTotalOrdersView({ orders }: Props) {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set())
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set())

  // Group: state → store → orders
  const byState = useMemo(() => {
    const map = new Map<string, Map<string, { branch: Branch; orders: Order[] }>>()
    for (const order of orders) {
      const state  = order.branch?.state  || 'Unknown State'
      const storeId = order.branch?.id    || 'unknown'
      if (!map.has(state)) map.set(state, new Map())
      const stateMap = map.get(state)!
      if (!stateMap.has(storeId)) stateMap.set(storeId, { branch: order.branch, orders: [] })
      stateMap.get(storeId)!.orders.push(order)
    }
    // Sort states alphabetically
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, storeMap]) => ({
        state,
        total: Array.from(storeMap.values()).reduce((s, v) => s + v.orders.length, 0),
        stores: Array.from(storeMap.values()).sort((a, b) => a.branch.name.localeCompare(b.branch.name)),
      }))
  }, [orders])

  const totalApproved  = orders.filter(o => o.status === 'approved').length
  const totalShipped   = orders.filter(o => o.status === 'shipped').length
  const totalDelivered = orders.filter(o => o.status === 'delivered').length

  function toggleState(state: string) {
    setExpandedStates(prev => {
      const next = new Set(prev)
      next.has(state) ? next.delete(state) : next.add(state)
      return next
    })
  }
  function toggleStore(key: string) {
    setExpandedStores(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">

      {/* Back */}
      <Link
        href="/dashboard/vendor"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </Link>

      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Total Orders</h1>
          <p className="text-xs text-gray-400">{orders.length} orders across all stores</p>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'New Orders',    value: totalApproved,  icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'In Delivery',   value: totalShipped,   icon: Truck,        color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Delivered',     value: totalDelivered, icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* State → Store breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">By State &amp; Store</h2>

        {byState.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-12 text-center">
            <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          byState.map(({ state, total, stores }) => {
            const stateOpen = expandedStates.has(state)
            return (
              <m.div
                key={state}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* State header */}
                <button
                  onClick={() => toggleState(state)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#570439]/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#570439]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{state}</p>
                      <p className="text-xs text-gray-400">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#570439] bg-[#570439]/10 px-2.5 py-1 rounded-full">
                      {total} orders
                    </span>
                    {stateOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Stores under this state */}
                <AnimatePresence>
                  {stateOpen && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="divide-y divide-gray-50">
                        {stores.map(({ branch, orders: storeOrders }) => {
                          const storeKey  = `${state}__${branch.id}`
                          const storeOpen = expandedStores.has(storeKey)
                          return (
                            <div key={branch.id}>
                              {/* Store row */}
                              <button
                                onClick={() => toggleStore(storeKey)}
                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <Store className="w-3.5 h-3.5 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
                                    <p className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-none">
                                      {[branch.address, branch.city].filter(Boolean).join(', ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {storeOrders.length} order{storeOrders.length !== 1 ? 's' : ''}
                                  </span>
                                  {storeOpen
                                    ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                                    : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                  }
                                </div>
                              </button>

                              {/* Orders under this store */}
                              <AnimatePresence>
                                {storeOpen && (
                                  <m.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden bg-gray-50"
                                  >
                                    <div className="px-5 py-2 space-y-2">
                                      {storeOrders.map(order => (
                                        <Link
                                          key={order.id}
                                          href={`/dashboard/vendor/orders/${order.id}`}
                                          className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-[#570439]/30 hover:shadow-sm transition-all"
                                        >
                                          <div>
                                            <p className="text-sm font-bold text-gray-800">{shortId(order.id)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                                          </div>
                                          <OrderStatusBadge status={order.status as any} />
                                        </Link>
                                      ))}
                                    </div>
                                    <div className="h-2" />
                                  </m.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            )
          })
        )}
      </div>
    </div>
  )
}
