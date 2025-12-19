'use client'

import { useEffect } from 'react'
import { preloadProductImages } from '@/lib/image-preloader'

interface ImagePreloaderProps {
  products: Array<{ images?: string[] }>
}

/**
 * Client Component for preloading images
 * Uses browser preload API for instant image display
 */
export function ImagePreloader({ products }: ImagePreloaderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Preload images immediately
    preloadProductImages(products)

    // Also add preload links to head for critical images
    const imageUrls = products
      .flatMap(p => p.images || [])
      .filter(img => img && !img.startsWith('data:') && !img.startsWith('blob:'))
      .slice(0, 6) // Preload first 6 images

    const links: HTMLLinkElement[] = []
    imageUrls.forEach((url, index) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      link.setAttribute('fetchpriority', index < 3 ? 'high' : 'low')
      document.head.appendChild(link)
      links.push(link)
    })

    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      })
    }
  }, [products])

  return null
}











