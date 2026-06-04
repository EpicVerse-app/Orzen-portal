'use client'

import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'

export default function SuperCartBar() {
  const { items, totalItems } = useCartStore()
  const router = useRouter()
  const total = totalItems()

  if (total === 0) return null

  return (
    <button
      onClick={() => router.push('/dashboard/super/view-order')}
      className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white flex items-center gap-2 px-5 py-3 rounded-full shadow-lg hover:bg-[#2a2a2a] transition-colors"
    >
      <ShoppingCart className="w-4 h-4" />
      <span className="text-sm font-semibold">View Order</span>
      <span className="bg-[#c9a84c] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {items.length}
      </span>
    </button>
  )
}
