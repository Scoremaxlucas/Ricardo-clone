'use client'

import { sellLinkWithReturn } from '@/lib/sell-navigation'
import { cn } from '@/lib/utils'
import { Package, Heart, Search, ShoppingBag, Inbox, FileQuestion, AlertCircle, LucideIcon } from 'lucide-react'
import Link from 'next/link'

/**
 * EmptyState Component - Einheitliches Design für leere Zustände
 * 
 * Verwendet für:
 * - Leere Listen (Favoriten, Bestellungen, etc.)
 * - Keine Suchergebnisse
 * - Keine Nachrichten
 * - Fehlerzustände
 */

interface EmptyStateProps {
  /** Vordefinierte Icons für häufige Anwendungsfälle */
  type?: 'favorites' | 'search' | 'orders' | 'messages' | 'products' | 'error' | 'custom'
  /** Custom Icon wenn type='custom' */
  icon?: LucideIcon
  /** Haupttitel */
  title: string
  /** Beschreibungstext */
  description?: string
  /** Primärer CTA Button */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Sekundärer Link */
  secondaryAction?: {
    label: string
    href: string
  }
  /** Zusätzliche CSS Klassen */
  className?: string
  /** Kompakte Variante für inline Nutzung */
  compact?: boolean
}

const iconMap: Record<string, LucideIcon> = {
  favorites: Heart,
  search: Search,
  orders: ShoppingBag,
  messages: Inbox,
  products: Package,
  error: AlertCircle,
  custom: FileQuestion,
}

const colorMap: Record<string, string> = {
  favorites: 'bg-red-50 text-red-400',
  search: 'bg-primary-50 text-primary-400',
  orders: 'bg-blue-50 text-blue-400',
  messages: 'bg-purple-50 text-purple-400',
  products: 'bg-gray-100 text-gray-400',
  error: 'bg-red-50 text-red-400',
  custom: 'bg-gray-100 text-gray-400',
}

export function EmptyState({
  type = 'custom',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const IconComponent = icon || iconMap[type]
  const colorClass = colorMap[type]

  if (compact) {
    return (
      <div className={cn('flex flex-col items-center py-8 text-center', className)}>
        <div className={cn('mb-3 flex h-12 w-12 items-center justify-center rounded-full', colorClass)}>
          <IconComponent className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center py-12 text-center md:py-16', className)}>
      {/* Icon */}
      <div className={cn(
        'mb-5 flex h-20 w-20 items-center justify-center rounded-2xl',
        colorClass
      )}>
        <IconComponent className="h-10 w-10" />
      </div>

      {/* Titel */}
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>

      {/* Beschreibung */}
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
                }}
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                  boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
                }}
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * NoSearchResults - Spezifische Variante für keine Suchergebnisse
 */
export function NoSearchResults({
  query,
  suggestion,
  onClearSearch,
}: {
  query?: string
  suggestion?: string
  onClearSearch?: () => void
}) {
  return (
    <EmptyState
      type="search"
      title={query ? `Keine Ergebnisse für "${query}"` : 'Keine Ergebnisse gefunden'}
      description={
        suggestion
          ? `Meinten Sie "${suggestion}"? Versuchen Sie es mit anderen Suchbegriffen.`
          : 'Versuchen Sie es mit anderen Suchbegriffen oder weniger Filtern.'
      }
      action={
        onClearSearch
          ? { label: 'Suche zurücksetzen', onClick: onClearSearch }
          : { label: 'Alle Artikel ansehen', href: '/search' }
      }
    />
  )
}

/**
 * NoFavorites - Spezifische Variante für leere Favoriten
 */
export function NoFavorites() {
  return (
    <EmptyState
      type="favorites"
      title="Noch keine Favoriten"
      description="Speichern Sie Artikel, die Ihnen gefallen, um sie später leichter wiederzufinden."
      action={{ label: 'Artikel entdecken', href: '/search' }}
    />
  )
}

/**
 * NoOrders - Spezifische Variante für keine Bestellungen
 */
export function NoOrders() {
  return (
    <EmptyState
      type="orders"
      title="Noch keine Bestellungen"
      description="Sobald Sie etwas kaufen, erscheinen Ihre Bestellungen hier."
      action={{ label: 'Jetzt stöbern', href: '/search' }}
    />
  )
}

/**
 * NoMessages - Spezifische Variante für keine Nachrichten
 */
export function NoMessages() {
  return (
    <EmptyState
      type="messages"
      title="Keine Nachrichten"
      description="Sobald Sie mit Käufern oder Verkäufern kommunizieren, erscheinen die Nachrichten hier."
    />
  )
}

/**
 * NoProducts - Spezifische Variante für keine Produkte
 */
export function NoProducts() {
  return (
    <EmptyState
      type="products"
      title="Noch keine Artikel"
      description="Erstellen Sie Ihren ersten Artikel und starten Sie mit dem Verkaufen."
      action={{
        label: 'Artikel einstellen',
        href: sellLinkWithReturn('/my-watches/selling'),
      }}
    />
  )
}
