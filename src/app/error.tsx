'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-xl font-semibold">Ein Fehler ist aufgetreten</h2>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        Erneut versuchen
      </button>
    </div>
  )
}
