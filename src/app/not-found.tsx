import Link from 'next/link'
import { SearchX, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <SearchX className="mx-auto mb-6 h-24 w-24 text-gray-300" />
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          404 - Seite nicht gefunden
        </h1>
        <p className="mb-8 max-w-md text-gray-600">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[50px] px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.3)',
            }}
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-[50px] border-2 border-primary-500 bg-white px-6 py-3 font-bold text-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-500 hover:text-white active:scale-[0.98]"
          >
            <Search className="h-4 w-4" />
            Artikel suchen
          </Link>
        </div>
      </div>
    </div>
  )
}
