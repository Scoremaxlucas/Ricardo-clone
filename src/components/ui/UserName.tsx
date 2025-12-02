'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { VerifiedBadge } from './VerifiedBadge'

interface UserNameProps {
  userId: string
  userName: string
  className?: string
  showVerifiedBadge?: boolean
  badgeSize?: 'sm' | 'md' | 'lg'
  linkToProfile?: boolean
}

export function UserName({
  userId,
  userName,
  className = '',
  showVerifiedBadge = true,
  badgeSize = 'sm',
  linkToProfile = true,
}: UserNameProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!showVerifiedBadge || !userId) return

    // Prüfe Verifizierungsstatus
    fetch(`/api/user/verified?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        setIsVerified(data.verified === true)
      })
      .catch(err => {
        console.error('Error loading verification status:', err)
        setIsVerified(false)
      })
  }, [userId, showVerifiedBadge])

  // Kürze sehr lange Namen um Layout-Probleme zu vermeiden (z.B. "Looool" bleibt, aber "VeryLongName" → "VeryLong...")
  const getDisplayName = () => {
    if (!userName) return 'Benutzer'
    // Kürze Namen die länger als 10 Zeichen sind
    if (userName.length > 10) {
      return `${userName.substring(0, 8)}...`
    }
    return userName
  }

  const displayName = getDisplayName()

  const content = (
    <>
      <span className="block truncate" title={userName}>
        {displayName}
      </span>
      {showVerifiedBadge && isVerified === true && <VerifiedBadge size={badgeSize} />}
    </>
  )

  if (linkToProfile) {
    return (
      <Link
        href={`/users/${userId}`}
        className={`inline-flex items-center gap-1 transition-colors hover:text-primary-600 ${className}`}
      >
        {content}
      </Link>
    )
  }

  return <span className={`inline-flex items-center gap-1 ${className}`}>{content}</span>
}
