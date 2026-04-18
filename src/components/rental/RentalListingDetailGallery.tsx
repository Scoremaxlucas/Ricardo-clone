'use client'

import { useState } from 'react'

type Props = { imageUrls: string[] }

export function RentalListingDetailGallery({ imageUrls }: Props) {
  const [lightbox, setLightbox] = useState(false)
  const urls = imageUrls.filter(u => typeof u === 'string' && u.length > 0)
  const main = urls[0]
  const thumbs = urls.slice(1, 5)
  const rest = urls.length - 1 - thumbs.length

  if (urls.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto flex aspect-[21/9] max-h-[320px] max-w-6xl items-center justify-center text-slate-400">
          <span className="text-5xl" aria-hidden>
            🏠
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-0 lg:px-4">
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:hidden">
            {urls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="h-52 w-[85vw] max-w-md shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden gap-3 py-4 lg:flex">
            <div className="w-[60%] shrink-0 overflow-hidden rounded-2xl bg-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main} alt="" className="aspect-[4/3] h-full w-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                {thumbs.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-[4/3] h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              {urls.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setLightbox(true)}
                  className="rounded-xl border border-teal-200 bg-white py-2 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
                >
                  Alle {urls.length} Fotos
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/80 p-4"
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
      ) : null}
    </>
  )
}
