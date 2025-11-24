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
  linkToProfile = true
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

  const content = (
    <>
      {userName}
      {showVerifiedBadge && isVerified === true && (
        <VerifiedBadge size={badgeSize} />
      )}
    </>
  )

  if (linkToProfile) {
    return (
      <Link 
        href={`/users/${userId}`}
        className={`inline-flex items-center gap-1 hover:text-primary-600 transition-colors ${className}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {content}
    </span>
  )
}





