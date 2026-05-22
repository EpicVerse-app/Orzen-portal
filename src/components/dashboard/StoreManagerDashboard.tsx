'use client'

import { useState } from 'react'
import { MapPin, Users, ShoppingCart, Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { Order, AppUser } from '@/types'
import PlaceOrderModal from '@/components/orders/PlaceOrderModal'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

interface Props {
  profile: AppUser
  orders: Order[]
}

export default function StoreManagerDashboard({ profile, orders }: Props) {
  const [showOrderModal, setShowOrderModal] = useState(false)

  const branch = profile.branch
  const company = profile.company

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{company?.name}</p>
            <h1 className="text-lg font-semibold text-gray-900">{branch?.name}</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm font-semibold">
              {profile.full_name?.charAt(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* Store Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Store Details</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-gray-800">{branch?.address}</p>
              <p className="text-xs text-gray-500">{branch?.city}, {branch?.state}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-sm text-gray-500 italic">Staff info coming soon</p>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={() => setShowOrderModal(true)}
          className="w-full bg-blue-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-medium text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <ShoppingCart className="w-5 h-5" />
          Place Order
        </button>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => (
                <div key={order.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items?.length || 0} items · {new Date(order.created_at).toLocaleDateString()}
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

      {showOrderModal && (
        <PlaceOrderModal
          companyId={profile.company_id}
          branchId={profile.branch_id!}
          userId={profile.id}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </div>
  )
}
