'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: (string | null | undefined)[]
  alt: string
  /** Extra classes on the outer wrapper (e.g. aspect ratio, rounded) */
  className?: string
  /** Size passed to next/image width & height */
  size?: number
}

export default function ImageCarousel({ images, alt, className = '', size = 200 }: Props) {
  const validImages = images.filter((img): img is string => !!img)
  const [index, setIndex] = useState(0)

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex(i => (i - 1 + validImages.length) % validImages.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex(i => (i + 1) % validImages.length)
  }

  if (validImages.length === 0) {
    return (
      <div className={`bg-gray-50 flex items-center justify-center ${className}`}>
        <Package className="w-10 h-10 text-gray-200" />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${className}`}>
      <Image
        src={validImages[index]}
        alt={`${alt} ${index + 1}`}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />

      {/* Navigation arrows — only if more than 1 image */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === index ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
