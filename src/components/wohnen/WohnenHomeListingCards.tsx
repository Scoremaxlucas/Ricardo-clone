'use client'

import { RentalListingCard } from '@/components/rental/RentalListingCard'
import Link from 'next/link'

export type WohnenHomeListingSerialized = {
  id: string
  title: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  requiresCreditCheck: boolean
  createdAt: string
  availableFrom: string
  photos: string[]
}

type Props = {
  listings: WohnenHomeListingSerialized[]
}

export function WohnenHomeListingCards({ listings }: Props) {
  return (
    <>
      <div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 scroll-smooth snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none lg:grid-cols-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {listings.map((l, idx) => (
          <div
            key={l.id}
            className="min-w-[74vw] max-w-[300px] shrink-0 snap-start transition-[transform,box-shadow] duration-[250ms] ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:min-w-0 sm:max-w-none"
          >
            <RentalListingCard
              imagePriority={idx === 0}
              listing={{
                id: l.id,
                title: l.title,
                city: l.city,
                canton: l.canton,
                rooms: l.rooms,
                areaSqm: l.areaSqm,
                floor: l.floor,
                rentPerMonth: l.rentPerMonth,
                utilitiesPerMonth: l.utilitiesPerMonth,
                availableFrom: l.availableFrom,
                photos: l.photos,
                requiresCreditCheck: l.requiresCreditCheck,
                createdAt: new Date(l.createdAt),
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/wohnungen" className="text-base font-semibold text-[#18a87c] underline-offset-2 hover:underline">
          Alle Wohnungen anzeigen →
        </Link>
      </div>
    </>
  )
}
