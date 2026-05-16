'use client'

import { FileUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { dispatchWohnenNavRefresh } from '@/lib/wohnen-nav-refresh'
import { wohnenToast } from '@/lib/wohnen-toast'
import toast from 'react-hot-toast'

type Phase = 'idle' | 'upload' | 'analyze'

export function BetreibungsregisterClient() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const pickFile = useCallback((f: File | null) => {
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Bitte nur eine PDF-Datei auswählen.')
      setFile(null)
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Die Datei darf maximal 5 MB gross sein.')
      setFile(null)
      return
    }
    setFile(f)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const f = e.dataTransfer.files?.[0]
      pickFile(f ?? null)
    },
    [pickFile]
  )

  const submit = async () => {
    setError(null)
    if (!file) {
      setError('Bitte wähle eine PDF-Datei aus.')
      return
    }
    if (!confirm) {
      setError('Bitte bestätige die Aussage zum Auszug.')
      return
    }

    setPhase('upload')
    await new Promise(r => setTimeout(r, 450))
    setPhase('analyze')

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('confirmPersonal', 'true')
      const res = await fetch('/api/tenant-profile/credit-check', { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        status?: string
        detail?: string
      }
      if (!res.ok) {
        setPhase('idle')
        setError(typeof data.message === 'string' ? data.message : 'Upload fehlgeschlagen')
        return
      }

      const status = data.status as string | undefined
      const message = typeof data.message === 'string' ? data.message : ''
      const detail = typeof data.detail === 'string' ? data.detail : ''

      if (status === 'APPROVED') {
        wohnenToast.creditVerified()
        dispatchWohnenNavRefresh()
        router.push('/profil')
        router.refresh()
        return
      }
      if (status === 'PENDING_MANUAL_REVIEW') {
        toast('Dokument wird manuell geprüft — wir melden uns per E-Mail.', { duration: 4500 })
        dispatchWohnenNavRefresh()
        router.push('/profil')
        router.refresh()
        return
      }
      if (status === 'REJECTED') {
        setPhase('idle')
        wohnenToast.creditInvalid()
        setError(
          [message, detail].filter(Boolean).join(' ') ||
            'Dokument ungültig oder zu alt. Bitte erneut versuchen.'
        )
        return
      }

      toast.success(message || 'Gespeichert')
      dispatchWohnenNavRefresh()
      router.push('/profil')
      router.refresh()
    } catch {
      setPhase('idle')
      setError('Netzwerkfehler — bitte später erneut versuchen.')
    }
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-[#f5fdfb] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-[#d4eee4] bg-white px-5 py-8 shadow-[0_24px_64px_-28px_rgba(13,43,31,0.12)] sm:px-8 sm:py-10">
          <Link
            href="/profil"
            className="inline-flex text-sm font-medium text-[#107a5a] underline-offset-2 transition hover:text-[#0d5c44] hover:underline"
          >
            ← Zurück zum Profil
          </Link>

          <h1 className="mt-5 text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em] text-[#0d2b1f] sm:text-[1.65rem]">
            Betreibungsregisterauszug hochladen
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5a7a6e] sm:text-[15px]">
            Lade einen gültigen Schweizer Betreibungsregisterauszug (PDF, max. 5 MB, max. 3 Monate alt) hoch. Muster- oder
            Beispiel-PDFs werden in der Regel nicht akzeptiert — es braucht einen echten Auszug vom Betreibungsamt.
          </p>

          <div className="mt-6 rounded-xl border border-[#bfe8d4] bg-[#f0faf5] px-4 py-4 text-sm leading-relaxed text-[#0d2b1f] sm:px-5">
            <p className="font-semibold text-[#107a5a]">Wo bekommst du den Betreibungsregisterauszug?</p>
            <p className="mt-2 text-[#2d4a3d]">
              Bestelle ihn online beim Betreibungsamt deines Wohnorts. Kosten: ca. CHF 17.–. Offizielle Übersicht und
              Bestellung unter{' '}
              <a
                href="https://www.betreibungsaemter.ch/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#107a5a] underline-offset-2 hover:underline"
              >
                betreibungsaemter.ch
              </a>{' '}
              oder direkt beim zuständigen kantonalen Betreibungsamt.
            </p>
          </div>

          <div className="mt-8 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-8 lg:items-start">
            <div className="hidden text-sm leading-relaxed text-[#5a7a6e] lg:block">
              <p className="font-semibold text-[#0d2b1f]">Hinweis</p>
              <p className="mt-2">
                Der Auszug muss auf deinen Namen lauten und darf höchstens drei Monate alt sein. Nach dem Upload prüfen
                wir das Dokument automatisch; in Grenzfällen erfolgt eine manuelle Freigabe.
              </p>
            </div>

            <div
              className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragOver ? 'border-[#18a87c] bg-[#f0faf5]' : 'border-[#cfe8dc] bg-[#fafdfb]'
              }`}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {phase !== 'idle' ?
                <div className="flex flex-col items-center gap-3 text-slate-700">
                  <Loader2 className="h-10 w-10 animate-spin text-[#18a87c]" aria-hidden />
                  <p className="text-sm font-medium text-[#0d2b1f]">
                    {phase === 'upload' ? 'Dokument wird hochgeladen…' : 'Dokument wird analysiert…'}
                  </p>
                </div>
              : <>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f7f2] text-[#18a87c]">
                    <FileUp className="h-6 w-6" strokeWidth={2} aria-hidden />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#0d2b1f]">PDF hierher ziehen oder Datei auswählen</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    aria-label="PDF-Datei für Betreibungsregisterauszug auswählen"
                    onChange={e => pickFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-4 rounded-xl border border-[#cfe8dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#2d4a3d] shadow-sm transition hover:border-[#18a87c]/40 hover:bg-[#f5fdfb]"
                  >
                    Datei auswählen
                  </button>
                  {file ? <p className="mt-3 text-sm font-medium text-[#0d2b1f]">{file.name}</p> : null}
                </>
              }
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <label className="mt-8 flex cursor-pointer items-start gap-3 text-sm text-[#2d4a3d]">
            <input
              type="checkbox"
              checked={confirm}
              onChange={e => {
                setConfirm(e.target.checked)
                setError(null)
              }}
              className="mt-1 h-5 w-5 shrink-0 rounded border-[#cfe8dc] text-[#18a87c] focus:ring-[#18a87c]"
            />
            <span className="leading-snug">
              Ich bestätige, dass dieser Auszug auf mich ausgestellt ist und max. 3 Monate alt ist. *
            </span>
          </label>

          <button
            type="button"
            disabled={phase !== 'idle'}
            onClick={submit}
            className="mt-8 w-full min-h-[52px] rounded-xl bg-[#18a87c] px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auszug hochladen und prüfen
          </button>
        </div>
      </div>
    </main>
  )
}
