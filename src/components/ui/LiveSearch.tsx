'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  placeholder?: string
  onSearch: (q: string) => void
  className?: string
}

export default function LiveSearch({ placeholder = 'Search…', onSearch, className = '' }: Props) {
  const [focused, setFocused] = useState(false)
  const [value,   setValue]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(v: string) {
    setValue(v)
    onSearch(v)
  }

  function clear() {
    setValue('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={`relative flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 transition-all duration-200 shadow-sm ${
        focused
          ? 'border-[#570439] shadow-[0_0_0_3px_rgba(87,4,57,0.08)]'
          : 'border-gray-200 hover:border-gray-300'
      } ${className}`}
    >
      <Search className={`w-4 h-4 shrink-0 transition-colors duration-150 ${focused ? 'text-[#570439]' : 'text-gray-400'}`} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
      />
      {value && (
        <button
          onClick={clear}
          className="shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  )
}
