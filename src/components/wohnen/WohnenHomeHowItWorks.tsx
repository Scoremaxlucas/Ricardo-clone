'use client'

import { useState } from 'react'

type Step = { n: number; icon: string; title: string; text: string }

const LANDLORD_STEPS: Step[] = [
  {
    n: 1,
    icon: '🏠',
    title: 'In 5 Minuten live',
    text: 'Inserat kostenlos erstellen oder von einer anderen Plattform importieren — mit einem Klick vorausgefüllt.',
  },
  {
    n: 2,
    icon: '✅',
    title: 'Nur ernsthafte Anfragen',
    text: 'Jeder Bewerber hat sein Betreibungsregister bereits verifiziert. Du sparst Stunden an Filtern und Rückfragen.',
  },
  {
    n: 3,
    icon: '💬',
    title: 'Direkt zum richtigen Mieter',
    text: 'Wähle aus verifizierten Profilen und vereinbare die Besichtigung — alles auf der Plattform.',
  },
]

const TENANT_STEPS: Step[] = [
  {
    n: 1,
    icon: '👤',
    title: 'Profil einmal erstellen',
    text: 'Name, Einkommen, Beschäftigung — alles an einem Ort gespeichert. Nie wieder dasselbe Formular ausfüllen.',
  },
  {
    n: 2,
    icon: '🔒',
    title: 'Sofort ernst genommen werden',
    text: 'Lade dein Betreibungsregister einmal hoch — es gilt für alle deine Bewerbungen und zeigt Vermietern nur: Einträge ja/nein.',
  },
  {
    n: 3,
    icon: '🚀',
    title: 'Bewerben in 30 Sekunden',
    text: 'Kein Formular ausfüllen. Kein erneutes Hochladen. Einmal verifiziert — überall sofort bewerben.',
  },
]

function StepCard({ step }: { step: Step }) {
  return (
    <div className="relative rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <span className="absolute left-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#18a87c] text-sm font-bold text-white">
        {step.n}
      </span>
      <div className="mb-3 mt-10 text-[40px] leading-none" aria-hidden>
        {step.icon}
      </div>
      <h3 className="text-lg font-bold leading-snug text-slate-900">{step.title}</h3>
      <p className="mt-2 text-[15px] font-normal leading-relaxed text-[#5a7a6e]">{step.text}</p>
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
      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-[28px] md:leading-tight">{title}</h3>
      <div className="mt-6 space-y-4">
        {steps.map(s => (
          <StepCard key={s.n} step={s} />
        ))}
      </div>
    </div>
  )
}

export function WohnenHomeHowItWorks() {
  const [tab, setTab] = useState<'landlord' | 'tenant'>('landlord')

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-center text-[28px] font-extrabold tracking-[-0.02em] text-slate-900 sm:text-[36px] sm:tracking-[-0.04em]">
        So einfach war Wohnungssuche noch nie.
      </h2>

      <div className="mt-8 md:hidden">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab('landlord')}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
              tab === 'landlord' ? 'border-b-2 border-[#18a87c] text-[#18a87c]' : 'border-b-2 border-transparent text-slate-500'
            }`}
          >
            Vermieter
          </button>
          <button
            type="button"
            onClick={() => setTab('tenant')}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
              tab === 'tenant' ? 'border-b-2 border-[#18a87c] text-[#18a87c]' : 'border-b-2 border-transparent text-slate-500'
            }`}
          >
            Mietende
          </button>
        </div>
        <div className="mt-8">
          {tab === 'landlord' ?
            <Column variant="landlord" label="FÜR VERMIETER" title="Weniger Aufwand. Bessere Mieter." steps={LANDLORD_STEPS} />
          : <Column variant="tenant" label="FÜR MIETENDE" title="Einmal verifiziert. Überall beworben." steps={TENANT_STEPS} />}
        </div>
      </div>

      <div className="mt-12 hidden gap-12 md:grid md:grid-cols-2 md:gap-10 lg:gap-16">
        <Column variant="landlord" label="FÜR VERMIETER" title="Weniger Aufwand. Bessere Mieter." steps={LANDLORD_STEPS} />
        <Column variant="tenant" label="FÜR MIETENDE" title="Einmal verifiziert. Überall beworben." steps={TENANT_STEPS} />
      </div>
    </div>
  )
}
