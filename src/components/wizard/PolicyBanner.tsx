'use client'

import { EditPolicy } from '@/lib/edit-policy'
import { AlertCircle, Info, Lock } from 'lucide-react'

interface PolicyBannerProps {
  policy: EditPolicy
}

export function PolicyBanner({ policy }: PolicyBannerProps) {
  if (policy.level === 'FULL' || !policy.reason) {
    return null
  }

  const getBannerStyle = () => {
    switch (policy.level) {
      case 'READ_ONLY':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
        }
      case 'LIMITED_APPEND_ONLY':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          iconBg: 'bg-amber-100',
        }
      case 'PUBLISHED_LIMITED':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100',
        }
    }
  }

  const style = getBannerStyle()
  const Icon =
    policy.level === 'READ_ONLY'
      ? Lock
      : policy.level === 'LIMITED_APPEND_ONLY'
        ? AlertCircle
        : Info

  return (
    <div className={`mb-6 rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
        >
          <Icon className={`h-5 w-5 ${style.icon}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.icon}`}>{policy.reason}</p>
        </div>
      </div>
    </div>
  )
}
