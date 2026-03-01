// [CYCL:01109070-ff41-42dd-a9e5-1b8e62970023] Root layout with PWA meta tags and manifest
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { InstallPrompt } from '@/components/InstallPrompt'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'HabitPack',
  description: 'Build habits together with your group',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HabitPack',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#13112b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased bg-[#0f0e1a] text-white`}>
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
