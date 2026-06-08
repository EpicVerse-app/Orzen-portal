'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * useLiveOrders — real-time order updates with ZERO page refresh.
 *
 * When an order changes in the DB, we fetch just that one order
 * (with full joins) and patch local state instantly.
 *
 * @param initialOrders  Server-rendered orders passed as props
 * @param companyId      Filter channel to this company
 * @param fetchOne       Async fn that fetches a single full order by id
 * @param keepStatuses   Only keep orders whose status is in this list
 *                       (pass undefined to keep all)
 */
export function useLiveOrders<T extends { id: string; status: string }>(
  initialOrders: T[],
  companyId: string | null | undefined,
  fetchOne: (id: string) => Promise<T | null>,
  keepStatuses?: string[],
): T[] {
  const [orders, setOrders] = useState<T[]>(initialOrders)

  // Keep in sync when server re-renders (e.g. navigating back)
  useEffect(() => { setOrders(initialOrders) }, [initialOrders])

  const patch = useCallback(async (changedId: string) => {
    const updated = await fetchOne(changedId)

    setOrders(prev => {
      // Remove old entry for this id
      const without = prev.filter(o => o.id !== changedId)
      if (!updated) return without                               // deleted
      if (keepStatuses && !keepStatuses.includes(updated.status)) return without  // no longer relevant
      // Insert at front (most recent first)
      return [updated, ...without]
    })
  }, [fetchOne, keepStatuses])

  useEffect(() => {
    if (!companyId) return

    const supabase = createClient()
    const channel  = supabase
      .channel(`orders-live:${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` },
        (payload) => {
          const id = (payload.new as any)?.id || (payload.old as any)?.id
          if (id) patch(id)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [companyId, patch])

  return orders
}
