'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to order changes for a company and refresh the page automatically.
 * Debounced so rapid successive changes only trigger one refresh.
 */
export function useRealtimeOrders(companyId: string | null | undefined) {
  const router   = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!companyId) return

    const supabase = createClient()

    function refresh() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => router.refresh(), 600)
    }

    const channel = supabase
      .channel(`orders:company:${companyId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'orders',
          filter: `company_id=eq.${companyId}`,
        },
        refresh,
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [companyId, router])
}
