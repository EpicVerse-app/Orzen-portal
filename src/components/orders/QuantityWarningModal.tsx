'use client'

import { AlertTriangle, X } from 'lucide-react'
import { NORMAL_MAX_QTY } from '@/lib/constants/order'

interface Props {
  productName: string
  quantity: number
  onClose: () => void
}

export default function QuantityWarningModal({ productName, quantity, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-amber-50 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900">Check Quantity</h2>
            <p className="text-sm text-amber-700 mt-0.5">This item is above the usual order quantity</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5" type="button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 leading-relaxed">
              Normally this branch orders{' '}
              <span className="font-bold">{NORMAL_MAX_QTY} quantity</span> of{' '}
              <span className="font-bold text-amber-700">{productName}</span>.
              You have entered{' '}
              <span className="font-bold text-red-600">{quantity}</span>.
              Please check before continuing.
            </p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            type="button"
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Go Back & Edit
          </button>
        </div>
      </div>
    </div>
  )
}
