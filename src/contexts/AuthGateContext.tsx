'use client'

import { LoginPromptModal } from '@/components/ui/LoginPromptModal'
import { useSession } from 'next-auth/react'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface AuthGateContextType {
  /**
   * Guard an action behind authentication.
   * If the user is logged in, the callback runs immediately.
   * If not, the login/register modal is shown.
   *
   * @param options.title - Optional custom modal title
   * @param options.message - Optional custom modal message
   */
  requireAuth: (options?: { title?: string; message?: string }) => boolean
  /** Open the login modal manually */
  openLoginModal: (options?: { title?: string; message?: string }) => void
}

const AuthGateContext = createContext<AuthGateContextType | undefined>(undefined)

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState<string | undefined>()
  const [modalMessage, setModalMessage] = useState<string | undefined>()

  const openLoginModal = useCallback(
    (options?: { title?: string; message?: string }) => {
      setModalTitle(options?.title)
      setModalMessage(options?.message)
      setIsModalOpen(true)
    },
    []
  )

  const requireAuth = useCallback(
    (options?: { title?: string; message?: string }): boolean => {
      if (session?.user) {
        return true
      }
      openLoginModal(options)
      return false
    },
    [session?.user, openLoginModal]
  )

  return (
    <AuthGateContext.Provider value={{ requireAuth, openLoginModal }}>
      {children}
      <LoginPromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
      />
    </AuthGateContext.Provider>
  )
}

export function useAuthGate() {
  const context = useContext(AuthGateContext)
  if (context === undefined) {
    throw new Error('useAuthGate must be used within an AuthGateProvider')
  }
  return context
}
