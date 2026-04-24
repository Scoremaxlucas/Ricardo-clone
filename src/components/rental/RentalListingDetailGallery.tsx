'use client'

import { isVercelBlobImageUrl } from '@/lib/rental/remote-image'
import { Building2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type Props = { imageUrls: string[] }

export function RentalListingDetailGallery({ imageUrls }: Props) {
  const [lightbox, setLightbox] = useState(false)
  const urls = imageUrls.filter(u => typeof u === 'string' && u.length > 0)
  const main = urls[0]
  const thumbs = urls.slice(1, 5)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || urls.length === 0) return

    const measure = () => {
      const first = el.children[0] as HTMLElement | undefined
      const w = first?.offsetWidth || el.clientWidth || 1
      const i = Math.round(el.scrollLeft / w)
      setActiveIdx(Math.max(0, Math.min(urls.length - 1, i)))
    }

    measure()
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [urls.length])

  if (urls.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto flex aspect-[21/9] max-h-[320px] max-w-6xl items-center justify-center text-slate-400">
          <Building2 className="h-14 w-14 opacity-50" aria-hidden />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="relative mx-auto max-w-6xl lg:px-4">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth scroll-pl-[env(safe-area-inset-left,0px)] scroll-pr-[env(safe-area-inset-right,0px)] pb-3 pt-3 [-webkit-overflow-scrolling:touch] lg:hidden"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {urls.map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] w-[calc(100vw-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-w-full shrink-0 snap-start overflow-hidden bg-slate-200 sm:rounded-xl"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                  unoptimized={!isVercelBlobImageUrl(src)}
                />
              </div>
            ))}
          </div>
          {urls.length > 1 ? (
            <div
              className="pointer-events-none absolute bottom-5 right-[max(0.75rem,env(safe-area-inset-right,0px))] rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white lg:hidden"
              aria-live="polite"
            >
              {activeIdx + 1} / {urls.length}
            </div>
          ) : null}

          <div className="hidden gap-3 py-4 lg:flex">
            <div className="relative aspect-[4/3] w-[60%] shrink-0 overflow-hidden rounded-2xl bg-slate-200">
              <Image
                src={main}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 60vw, 720px"
                priority
                unoptimized={!isVercelBlobImageUrl(main)}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                {thumbs.map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 20vw, 240px"
                      unoptimized={!isVercelBlobImageUrl(src)}
                    />
                  </div>
                ))}
              </div>
              {urls.length > 1 ?
                <button
                  type="button"
                  onClick={() => setLightbox(true)}
                  className="rounded-xl border border-teal-200 bg-white py-2 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
                >
                  Alle {urls.length} Fotos
                </button>
              : null}
            </div>
          </div>
        </div>
      </div>

      {lightbox ?
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
          role="dialog"
          aria-modal="true"
          aria-label="Fotogalerie"
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Schliessen
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-8">
            {urls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="w-full rounded-lg object-contain" />
            ))}
          </div>
        </div>
      : null}
    </>
  )
}
