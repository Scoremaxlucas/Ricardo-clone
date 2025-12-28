'use client'

import { Archive, CheckCircle, FileText, ShoppingBag } from 'lucide-react'

export type TabType = 'active' | 'drafts' | 'archive' | 'sold'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ReactNode
}

const tabs: TabConfig[] = [
  { id: 'active', label: 'Aktiv', icon: <CheckCircle className="h-4 w-4" /> },
  { id: 'drafts', label: 'Entwürfe', icon: <FileText className="h-4 w-4" /> },
  { id: 'archive', label: 'Archiv', icon: <Archive className="h-4 w-4" /> },
  { id: 'sold', label: 'Verkauft', icon: <ShoppingBag className="h-4 w-4" /> },
]

interface ListingsTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  counts: {
    active: number
    drafts: number
    ended: number
    sold: number
  }
}

export function ListingsTabs({ activeTab, onTabChange, counts }: ListingsTabsProps) {
  const getCount = (tab: TabType) => {
    switch (tab) {
      case 'active':
        return counts.active
      case 'drafts':
        return counts.drafts
      case 'archive':
        return counts.ended
      case 'sold':
        return counts.sold
      default:
        return 0
    }
  }

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-1 overflow-x-auto" role="tablist" aria-label="Listings Tabs">
        {tabs.map(tab => {
          const count = getCount(tab.id)
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`
                    rounded-full px-2 py-0.5 text-xs font-semibold
                    ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
