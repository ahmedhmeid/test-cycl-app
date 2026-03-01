// [CYCL:2e0ff9ca] PWA install prompt for Android (beforeinstallprompt) and iOS Safari instructions
'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// [CYCL:2e0ff9ca] Detect iOS Safari specifically for custom install instructions
function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua)
  return isIos && isSafari
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
}

const DISMISS_KEY = 'habitpack_install_dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIos, setShowIos] = useState(false)
  const [showIosTooltip, setShowIosTooltip] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY)) return

    // iOS Safari: show custom instructions
    if (isIosSafari()) {
      setShowIos(true)
      return
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShowAndroid(false)
    setShowIos(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss()
    }
    setDeferredPrompt(null)
    setShowAndroid(false)
  }

  if (!showAndroid && !showIos) return null

  return (
    <>
      {/* Android install banner */}
      {showAndroid && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom">
          <div className="bg-[#1e1a3a] border border-purple-500/30 rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 flex items-center justify-center text-2xl flex-shrink-0">
              📲
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">Add HabitPack to Home Screen</p>
              <p className="text-xs text-gray-400 mt-0.5">Get the full app experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={dismiss}
                className="text-xs text-gray-500 px-3 py-1.5"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS install instructions */}
      {showIos && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom">
          <div className="bg-[#1e1a3a] border border-purple-500/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-xl flex-shrink-0">
                  📲
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Install HabitPack</p>
                  <p className="text-xs text-gray-400">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none p-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="w-6 h-6 rounded-full bg-purple-600/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">1</span>
                <span>Tap the <strong className="text-white">Share</strong> button{' '}
                  <span className="inline-block bg-gray-700 rounded px-1.5 py-0.5 text-xs">⎙</span>
                  {' '}in Safari
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="w-6 h-6 rounded-full bg-purple-600/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">2</span>
                <span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="w-6 h-6 rounded-full bg-purple-600/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">3</span>
                <span>Tap <strong className="text-white">"Add"</strong> to confirm</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
