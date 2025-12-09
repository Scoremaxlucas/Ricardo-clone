'use client'

import { useEffect } from 'react'

/**
 * Service Worker Registration Component
 *
 * Registers service worker for offline caching and PWA capabilities
 */
export function ServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to reload
                  console.log('New service worker available')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  return null
}

