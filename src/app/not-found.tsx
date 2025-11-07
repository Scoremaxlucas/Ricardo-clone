export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">404 - Seite nicht gefunden</h2>
      <p className="mt-4 text-gray-600">Die angeforderte Seite existiert nicht.</p>
      <a
        href="/"
        className="mt-6 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        Zur Startseite
      </a>
    </div>
  )
}
