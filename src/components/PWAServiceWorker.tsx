'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

// Registers the service worker and shows an install banner
export default function PWAServiceWorker() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SW] registered', reg.scope))
        .catch((err) => console.warn('[SW] registration failed', err))
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      // Only show if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Hide banner if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setShowBanner(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    const prompt = installPrompt as any
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setShowBanner(false)
    setInstallPrompt(null)
  }

  if (!showBanner || installed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#c9a84c] rounded-xl flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Install Orzen Flow</p>
          <p className="text-gray-400 text-xs">Add to home screen for quick access</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-[#c9a84c] text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#b8973b] transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
