'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  label: string
  value: number
  icon: React.ElementType
  href?: string
  color: string       // e.g. 'text-blue-600'
  bg: string          // e.g. 'bg-blue-50'
  index?: number      // stagger index 0-7
  suffix?: string
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    let start: number | null = null
    const from = 0

    function step(ts: number) {
      if (start === null) start = ts
      const elapsed  = ts - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(from + (target - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }

    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return count
}

export default function AnimatedStatCard({ label, value, icon: Icon, href, color, bg, index = 0, suffix }: Props) {
  const count  = useCountUp(value)
  const delay  = index * 60
  const stagger = `stagger-${Math.min(index + 1, 8)}`

  const card = (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 card-hover animate-fade-in-up ${stagger} group cursor-pointer`}
      style={{ opacity: 0 }}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className={`w-[18px] h-[18px] ${color}`} />
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        {count}{suffix}
      </p>

      {/* Label */}
      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</p>

      {/* Bottom accent line */}
      <div className={`h-0.5 rounded-full mt-3 ${bg} transition-all duration-300 group-hover:opacity-80`}
        style={{ width: `${Math.min((value / Math.max(value, 1)) * 100, 100)}%`, minWidth: 20 }} />
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{card}</Link>
  }
  return card
}
