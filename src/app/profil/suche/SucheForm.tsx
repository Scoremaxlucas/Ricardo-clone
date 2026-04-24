'use client'

import { CustomDropdown, type DropdownOption } from '@/components/profil/CustomDropdown'
import { KantonChips } from '@/components/profil/KantonChips'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const INPUT_CLASS =
  'h-14 min-h-[56px] w-full rounded-[14px] border-[1.5px] border-[#e8e8e8] bg-white px-5 text-base font-medium text-[#0d2b1f] shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-[#c0c0c0] focus:border-[#18a87c] focus:shadow-[0_0_0_4px_rgba(24,168,124,0.1)]'

function budgetOpts(): DropdownOption<string>[] {
  const o: DropdownOption<string>[] = [{ value: '', label: 'Keine Angabe' }]
  for (let n = 500; n <= 10000; n += 500) {
    o.push({ value: String(n), label: `CHF ${n.toLocaleString('de-CH')}` })
  }
  for (const n of [12000, 15000, 20000, 25000, 30000, 40000, 50000]) {
    o.push({ value: String(n), label: `CHF ${n.toLocaleString('de-CH')}` })
  }
  return o
}

function roomOpts(): DropdownOption<string>[] {
  const o: DropdownOption<string>[] = [{ value: '', label: 'Keine Angabe' }]
  const steps = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8]
  for (const r of steps) {
    const s = String(r)
    o.push({ value: s, label: `${String(r).replace('.', ',')} Zi.` })
  }
  return o
}

type ApiProfile = Record<string, unknown> & {
  firstName: string
  lastName: string
  dateOfBirth: string
  currentAddress: string
  currentZip: string
  currentCity: string
  contactPhone: string
  applicationEmail: string | null
  employmentStatus: string
  employer: string | null
  jobTitle: string | null
  employedSince: string | null
  monthlyIncomeCategory: string
  householdTotalPersons: number
  householdChildrenCount: number
  declaresNonSmoker: boolean | null
  householdPets: string
  referenceName: string | null
  referencePhone: string | null
  referenceRelation: string | null
  preferredCanton: string | null
  preferredPostalCodes: string | null
  preferredBudgetMin: number | null
  preferredBudgetMax: number | null
  preferredMinRooms: number | null
  preferredMaxRooms: number | null
  preferredMoveInEarliest: string | null
  preferredMoveInLatest: string | null
}

function isoToDe(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function deToIso(s: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim())
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2]) - 1
  const y = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  const mm = String(mo + 1).padStart(2, '0')
  return `${y}-${mm}-${String(d).padStart(2, '0')}`
}

function employedParts(iso: string | null): { y: string; m: string } {
  if (!iso) return { y: '', m: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { y: '', m: '' }
  return { y: String(d.getUTCFullYear()), m: String(d.getUTCMonth() + 1) }
}

export function SucheForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [base, setBase] = useState<ApiProfile | null>(null)
  const [cantonCodes, setCantonCodes] = useState<string[]>([])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [roomsMin, setRoomsMin] = useState('')
  const [roomsMax, setRoomsMax] = useState('')
  const [moveEarliest, setMoveEarliest] = useState('')
  const [moveLatest, setMoveLatest] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tenant-profile', { credentials: 'same-origin' })
      const data = (await res.json()) as { profile?: ApiProfile | null }
      if (!res.ok || !data.profile) {
        router.push('/profil/erstellen')
        return
      }
      const p = data.profile
      setBase(p)
      const pc = (p.preferredCanton ?? '')
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
      setCantonCodes(pc.sort())
      setBudgetMin(p.preferredBudgetMin != null ? String(p.preferredBudgetMin) : '')
      setBudgetMax(p.preferredBudgetMax != null ? String(p.preferredBudgetMax) : '')
      setRoomsMin(p.preferredMinRooms != null ? String(p.preferredMinRooms) : '')
      setRoomsMax(p.preferredMaxRooms != null ? String(p.preferredMaxRooms) : '')
      setMoveEarliest(isoToDe(p.preferredMoveInEarliest))
      setMoveLatest(isoToDe(p.preferredMoveInLatest))
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  const toggleCanton = (code: string) => {
    setCantonCodes(prev => {
      const s = new Set(prev)
      if (s.has(code)) s.delete(code)
      else s.add(code)
      return Array.from(s).sort()
    })
  }

  const save = async () => {
    if (!base) return
    setSaving(true)
    try {
      const es = employedParts(base.employedSince)
      const body = {
        firstName: base.firstName,
        lastName: base.lastName,
        dateOfBirth: base.dateOfBirth,
        currentAddress: base.currentAddress,
        currentZip: base.currentZip,
        currentCity: base.currentCity,
        contactPhone: base.contactPhone,
        applicationEmail: base.applicationEmail,
        employmentStatus: base.employmentStatus,
        employer: base.employer,
        jobTitle: base.jobTitle,
        employedSinceYear: es.y ? Number(es.y) : null,
        employedSinceMonth: es.m ? Number(es.m) : null,
        monthlyIncomeCategory: base.monthlyIncomeCategory,
        householdTotalPersons: base.householdTotalPersons,
        householdChildrenCount: base.householdChildrenCount,
        declaresNonSmoker: base.declaresNonSmoker,
        householdPets: base.householdPets,
        referenceName: base.referenceName,
        referencePhone: base.referencePhone,
        referenceRelation: base.referenceRelation,
        preferredCanton: cantonCodes.length ? cantonCodes.join(',') : null,
        preferredPostalCodes: base.preferredPostalCodes,
        preferredBudgetMin: budgetMin === '' ? null : Number(budgetMin),
        preferredBudgetMax: budgetMax === '' ? null : Number(budgetMax),
        preferredMinRooms: roomsMin === '' ? null : Number(roomsMin),
        preferredMaxRooms: roomsMax === '' ? null : Number(roomsMax),
        preferredMoveInEarliest: moveEarliest.trim() ? deToIso(moveEarliest) : null,
        preferredMoveInLatest: moveLatest.trim() ? deToIso(moveLatest) : null,
      }
      const res = await fetch('/api/tenant-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        window.alert((err as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      router.push('/profil')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-[#8aa89e]">
        Laden…
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white text-[#0d2b1f]">
      <header className="fixed left-0 right-0 top-0 z-50 flex min-h-16 flex-col border-b border-[#f0f0f0] bg-white pt-[env(safe-area-inset-top,0px)]">
        <div className="flex h-16 items-center pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/profil')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#0d2b1f] hover:bg-[#f5fdfb]"
          aria-label="Zurück"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        </div>
      </header>
      <main className="mx-auto max-w-[520px] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[calc(4rem+env(safe-area-inset-top,0px))] sm:px-6">
        <h1 className="text-[1.5rem] font-extrabold leading-tight sm:text-[1.75rem] md:text-[2rem]">Deine Suche</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">
          Diese Angaben verwenden wir für deine Matches. Alles optional.
        </p>

        <section className="mt-12">
          <h2 className="text-[1.375rem] font-extrabold leading-snug sm:text-[1.625rem] md:text-[2rem]">
            In welchen Kantonen suchst du?
          </h2>
          <div className="mt-10">
            <KantonChips selected={cantonCodes} onToggle={toggleCanton} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[1.375rem] font-extrabold leading-snug sm:text-[1.625rem] md:text-[2rem]">Was ist dein Budget?</h2>
          <div className="mt-10 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <CustomDropdown value={budgetMin} options={budgetOpts()} onChange={setBudgetMin} placeholder="Min" />
            <CustomDropdown value={budgetMax} options={budgetOpts()} onChange={setBudgetMax} placeholder="Max" />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[1.375rem] font-extrabold leading-snug sm:text-[1.625rem] md:text-[2rem]">
            Wie viele Zimmer brauchst du?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <CustomDropdown value={roomsMin} options={roomOpts()} onChange={setRoomsMin} placeholder="Min" />
            <CustomDropdown value={roomsMax} options={roomOpts()} onChange={setRoomsMax} placeholder="Max" />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[1.375rem] font-extrabold leading-snug sm:text-[1.625rem] md:text-[2rem]">
            Wann möchtest du einziehen?
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <input
              className={INPUT_CLASS}
              placeholder="Frühestens TT.MM.JJJJ"
              value={moveEarliest}
              onChange={e => setMoveEarliest(e.target.value)}
            />
            <input
              className={INPUT_CLASS}
              placeholder="Spätestens TT.MM.JJJJ"
              value={moveLatest}
              onChange={e => setMoveLatest(e.target.value)}
            />
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[72px] items-center border-t border-[#f0f0f0] bg-white pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[env(safe-area-inset-bottom,0px)] sm:px-6">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="flex h-12 min-h-[48px] w-full items-center justify-center rounded-xl bg-[#18a87c] text-[15px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Wird gespeichert…' : 'Suche speichern →'}
        </button>
      </footer>
    </div>
  )
}
