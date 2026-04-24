'use client'

import { IconDocument, IconHandshake, IconListing, IconProfile, IconRocket, IconShield } from '@/components/icons/WohnenHowItWorksIcons'
import { useState } from 'react'
import type { ReactNode } from 'react'

type Step = { n: number; icon: ReactNode; title: string; text: string }

const LANDLORD_STEPS: Step[] = [
  {
    n: 1,
    icon: <IconListing className="h-6 w-6 text-[#18a87c]" />,
    title: 'In 5 Minuten live',
    text: 'Inserat kostenlos erstellen oder von einer anderen Plattform importieren — mit einem Klick vorausgefüllt.',
  },
  {
    n: 2,
    icon: <IconShield className="h-6 w-6 text-[#18a87c]" />,
    title: 'Nur ernsthafte Anfragen',
    text: 'Jeder Bewerber hat seinen Betreibungsregisterauszug bereits verifiziert. Du sparst Stunden an Filtern und Rückfragen.',
  },
  {
    n: 3,
    icon: <IconHandshake className="h-6 w-6 text-[#18a87c]" />,
    title: 'Direkt zum richtigen Mieter',
    text: 'Wähle aus verifizierten Profilen und vereinbare die Besichtigung — alles auf der Plattform.',
  },
]

const TENANT_STEPS: Step[] = [
  {
    n: 1,
    icon: <IconProfile className="h-6 w-6 text-[#18a87c]" />,
    title: 'Profil einmal erstellen',
    text: 'Name, Einkommen, Beschäftigung — alles an einem Ort gespeichert. Nie wieder dasselbe Formular ausfüllen.',
  },
  {
    n: 2,
    icon: <IconDocument className="h-6 w-6 text-[#18a87c]" />,
    title: 'Sofort ernst genommen werden',
    text: 'Vervollständige dein Mieterprofil in wenigen Minuten — einmal eingerichtet, für alle Bewerbungen nutzbar. So wirkt deine Bewerbung seriös, ohne bei jeder Wohnung von vorne zu beginnen.',
  },
  {
    n: 3,
    icon: <IconRocket className="h-6 w-6 text-[#18a87c]" />,
    title: 'Bewerben in 30 Sekunden',
    text: 'Kein Formular ausfüllen. Kein erneutes Hochladen. Einmal verifiziert — überall sofort bewerben.',
  },
]

function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div className="relative pl-0">
      <div className="pointer-events-none absolute bottom-0 left-4 top-0 w-[2px] bg-[#18a87c]" aria-hidden />
      <div className="space-y-6 sm:space-y-8">
        {steps.map((step, idx) => (
          <div key={step.n} className="relative flex items-start gap-3.5 sm:gap-4">
            <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18a87c] text-sm font-bold text-white sm:h-9 sm:w-9">
              {step.n}
            </span>
            <div className="min-w-0 pt-0.5 sm:pt-0">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {step.icon}
                </span>
                <h4 className="text-[15px] font-bold text-slate-900 sm:text-base">{step.title}</h4>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[#5a7a6e]">{step.text}</p>
            </div>
            {idx === steps.length - 1 ? (
              <span className="absolute -bottom-2 left-4 top-8 w-[2px] bg-[#f5fdfb]" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function Column({ variant, steps, title, label }: { variant: 'landlord' | 'tenant'; steps: Step[]; title: string; label: string }) {
  const labelClass =
    variant === 'landlord' ?
      'text-[13px] font-semibold uppercase tracking-[0.12em] text-[#18a87c]'
    : 'text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-600'

  return (
    <div className="space-y-4">
      <p className={labelClass}>{label}</p>
      <h3 className="text-[1.25rem] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[1.375rem] md:text-[28px] md:leading-tight">
        {title}
      </h3>
      <div className="mt-6">
        <Timeline steps={steps} />
      </div>
    </div>
  )
}

export function WohnenHomeHowItWorks() {
  const [tab, setTab] = useState<'mietende' | 'vermieter'>('mietende')

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-center text-[1.25rem] font-extrabold leading-snug tracking-[-0.02em] text-slate-900 sm:text-[1.65rem] md:text-[2.25rem] md:tracking-[-0.04em]">
        So einfach war Wohnungssuche noch nie.
      </h2>

      <div className="mt-7 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab('mietende')}
          className={`flex min-h-[44px] flex-1 items-center justify-center pb-2 text-sm font-semibold transition-colors ${
            tab === 'mietende' ? 'border-b-2 border-[#18a87c] text-[#18a87c]' : 'border-b-2 border-transparent text-slate-500'
          }`}
        >
          Mietende
        </button>
        <button
          type="button"
          onClick={() => setTab('vermieter')}
          className={`flex min-h-[44px] flex-1 items-center justify-center pb-2 text-sm font-semibold transition-colors ${
            tab === 'vermieter' ? 'border-b-2 border-[#18a87c] text-[#18a87c]' : 'border-b-2 border-transparent text-slate-500'
          }`}
        >
          Vermieter
        </button>
      </div>

      <div className="mt-6 md:mt-8">
        {tab === 'mietende' ?
          <Column variant="tenant" label="FÜR MIETENDE" title="Einmal verifiziert. Überall beworben." steps={TENANT_STEPS} />
        : null}
        {tab === 'vermieter' ?
          <Column variant="landlord" label="FÜR VERMIETER" title="Weniger Aufwand. Bessere Mieter." steps={LANDLORD_STEPS} />
        : null}
      </div>
    </div>
  )
}
