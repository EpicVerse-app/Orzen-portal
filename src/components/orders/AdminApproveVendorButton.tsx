'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { approveVendorAssignment } from '@/app/actions/approveVendor'

export default function AdminApproveVendorButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleApprove() {
    setLoading(true)
    setError('')
    const result = await approveVendorAssignment(orderId)
    if ('error' in result) {
      setError(result.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-40"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? 'Approving…' : 'Approve & Unlock PO'}
      </button>
    </div>
  )
}
