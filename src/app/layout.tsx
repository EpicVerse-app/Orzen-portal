import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import PWAServiceWorker from '@/components/PWAServiceWorker'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#c9a84c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Orzen Flow',
  description: 'B2B Product Booking App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Orzen Flow',
    startupImage: '/icons/icon-512x512.png',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        {/* iOS standalone / splash */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Orzen Flow" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Prevent tap highlight on mobile */}
        <style>{`* { -webkit-tap-highlight-color: transparent; }`}</style>
      </head>
      <body className="min-h-full bg-gray-50 overscroll-none">
        {children}
        <PWAServiceWorker />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontSize: '14px' },
            duration: 3000,
          }}
        />
      </body>
    </html>
  )
}
