'use client'

import { useEffect, useState } from 'react'
import { VerifiedBadge } from './VerifiedBadge'

interface UserNameProps {
  userId: string
  userName: string
  className?: string
  showVerifiedBadge?: boolean
  badgeSize?: 'sm' | 'md' | 'lg'
}

export function UserName({ 
  userId, 
  userName, 
  className = '',
  showVerifiedBadge = true,
  badgeSize = 'sm'
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

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {userName}
      {showVerifiedBadge && isVerified === true && (
        <VerifiedBadge size={badgeSize} />
      )}
    </span>
  )
}





