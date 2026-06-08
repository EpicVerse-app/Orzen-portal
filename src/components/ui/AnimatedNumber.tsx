'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  duration?: number   // ms
  className?: string
}

export default function AnimatedNumber({ value, duration = 800, className }: Props) {
  const [display, setDisplay] = useState(0)
  const startRef  = useRef<number | null>(null)
  const fromRef   = useRef(0)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const to   = value
    if (from === to) return

    startRef.current = null

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className}>{display}</span>
}
