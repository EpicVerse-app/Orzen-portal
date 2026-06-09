'use client'

import Link from 'next/link'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import { m } from 'framer-motion'

interface Props {
  label: string
  value: number
  icon: React.ElementType
  href?: string
  color: string       // e.g. 'text-blue-600'
  bg: string          // e.g. 'bg-blue-50'
  index?: number      // stagger index 0-7
  suffix?: string
  onClick?: () => void
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
}

export default function AnimatedStatCard({
  label, value, icon: Icon, href, color, bg, index = 0, suffix, onClick,
}: Props) {
  const delay = index * 0.06

  const inner = (
    <m.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(87,4,57,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group cursor-pointer h-full"
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className={`w-[18px] h-[18px] ${color}`} />
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold tabular-nums ${color}`}>
        <AnimatedNumber value={value} />{suffix}
      </p>

      {/* Label */}
      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</p>
    </m.div>
  )

  if (href) return <Link href={href} className="block h-full">{inner}</Link>
  if (onClick) return <button onClick={onClick} className="block w-full h-full text-left">{inner}</button>
  return inner
}
