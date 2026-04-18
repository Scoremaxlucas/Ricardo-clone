'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
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
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPhase('idle')
        setError(typeof data.message === 'string' ? data.message : 'Upload fehlgeschlagen')
        return
      }

      const status = data.status as string | undefined
      const message = typeof data.message === 'string' ? data.message : ''

      if (status === 'APPROVED') {
        toast.success('Betreibungsregister erfolgreich verifiziert ✅')
        router.push('/profil')
        router.refresh()
        return
      }
      if (status === 'PENDING_MANUAL_REVIEW') {
        toast('Dokument wird manuell geprüft — wir melden uns per E-Mail.', { icon: '✉️' })
        router.push('/profil')
        router.refresh()
        return
      }
      if (status === 'REJECTED') {
        setPhase('idle')
        setError(message || 'Dokument ungültig oder zu alt. Bitte erneut versuchen.')
        return
      }

      toast.success(message || 'Gespeichert')
      router.push('/profil')
      router.refresh()
    } catch {
      setPhase('idle')
      setError('Netzwerkfehler — bitte später erneut versuchen.')
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:py-10">
      <Link href="/profil" className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline">
        ← Zurück zum Profil
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Betreibungsregister hochladen</h1>
      <p className="mt-2 text-sm text-slate-600">
        Lade einen gültigen Schweizer Betreibungsregisterauszug (PDF, max. 3 Monate alt) hoch.
      </p>

      <div className="mt-6 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-relaxed text-teal-900">
        <p className="font-semibold text-teal-950">Wo bekommst du den Betreibungsregisterauszug?</p>
        <p className="mt-1">
          Bestelle ihn online beim Betreibungsamt deines Wohnorts. Kosten: ca. CHF 17.–. Erhältlich auf betreibungsaemter.ch
          oder direkt beim zuständigen kantonalen Betreibungsamt.
        </p>
      </div>

      <div
        className={`mt-8 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
          dragOver ? 'border-teal-500 bg-teal-50/50' : 'border-slate-300 bg-white'
        }`}
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {phase !== 'idle' ? (
          <div className="flex flex-col items-center gap-3 text-slate-700">
            <Loader2 className="h-10 w-10 animate-spin text-teal-700" aria-hidden />
            <p className="text-sm font-medium">
              {phase === 'upload' ? 'Dokument wird hochgeladen…' : 'Dokument wird analysiert…'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600">PDF hierher ziehen oder Datei auswählen</p>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => pickFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Datei auswählen
            </button>
            {file ? <p className="mt-3 text-sm font-medium text-slate-900">{file.name}</p> : null}
          </>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <label className="mt-6 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={confirm}
          onChange={e => {
            setConfirm(e.target.checked)
            setError(null)
          }}
          className="mt-1"
        />
        <span>Ich bestätige, dass dieser Auszug auf mich ausgestellt ist und max. 3 Monate alt ist. *</span>
      </label>

      <button
        type="button"
        disabled={phase !== 'idle'}
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Auszug hochladen und prüfen
      </button>
    </main>
  )
}
