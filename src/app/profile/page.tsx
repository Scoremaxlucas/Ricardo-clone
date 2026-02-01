'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/contexts/LanguageContext'
import { Bell, Camera, CheckCircle, Lock, Settings, Wallet } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { t } = useLanguage()
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)
  const [positivePercentage, setPositivePercentage] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    nickname: (session?.user as { nickname?: string | null })?.nickname || '',
    bio: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup: Remove old global localStorage key (was causing bug where all users shared same image)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileImage') // Remove the buggy global key
    }
  }, [])

  // Lade Nickname aus DB, falls nicht in Session
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id
    const userNickname = (session?.user as { nickname?: string | null })?.nickname
    if (userId && !userNickname) {
      fetch(`/api/user/nickname?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.nickname) {
            setFormData(prev => ({ ...prev, nickname: data.nickname }))
          }
        })
        .catch(err => console.error('Error loading nickname:', err))
    }
  }, [
    (session?.user as { id?: string })?.id,
    (session?.user as { nickname?: string | null })?.nickname,
  ])

  // Lade Verifizierungsstatus und Bewertungsstatistiken
  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      fetch('/api/verification/get')
        .then(res => res.json())
        .then(data => {
          if (data.verified) {
            setIsVerified(true)
            setVerifiedAt(data.verifiedAt)
          } else {
            setIsVerified(false)
          }
        })
        .catch(err => console.error('Error loading verification status:', err))

      // Lade Bewertungsstatistiken und Bio
      fetch(`/api/users/${userId}/stats`)
        .then(res => res.json())
        .then(data => {
          if (
            data.stats?.positivePercentage !== null &&
            data.stats?.positivePercentage !== undefined
          ) {
            setPositivePercentage(data.stats.positivePercentage)
          }
          if (data.user?.bio != null) {
            setFormData(prev => ({ ...prev, bio: data.user.bio || '' }))
          }
        })
        .catch(err => console.error('Error loading user stats:', err))
    }
  }, [(session?.user as { id?: string })?.id])

  // Initialisiere Formular und Profilbild
  useEffect(() => {
    // Formular-Daten aktualisieren
    if (session?.user) {
      const u = session.user
      setFormData(prev => ({
        ...prev,
        name: u.name || '',
        email: u.email || '',
        nickname: (u as { nickname?: string | null })?.nickname || '',
      }))
    }

    // Profilbild aus der Datenbank/Session laden (NICHT aus localStorage!)
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      // Lade das aktuelle Profilbild aus der Datenbank
      fetch(`/api/profile/get-image?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.image) {
            setProfileImage(data.image)
          } else if (session?.user?.image) {
            // Fallback auf Session-Bild
            setProfileImage(session.user.image)
          }
        })
        .catch(err => {
          console.error('Error loading profile image:', err)
          // Fallback auf Session-Bild
          if (session?.user?.image) {
            setProfileImage(session.user.image)
          }
        })
    } else if (session?.user?.image) {
      setProfileImage(session.user.image)
    }
  }, [session?.user?.name, session?.user?.email, session?.user?.image, (session?.user as { id?: string })?.id])

  // Initialen aus Name extrahieren
  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Prüfe Dateityp
      if (!file.type.startsWith('image/')) {
        toast.error(t.profile.imageTypeError)
        return
      }

      // Prüfe Dateigröße (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.profile.imageSizeError)
        return
      }

      // Erstelle Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      toast.error(t.profile.notLoggedIn)
      return
    }

    setIsUploading(true)
    const file = fileInputRef.current.files[0]

    try {
      // Upload zum Server (Vercel Blob Storage)
      const formData = new FormData()
      formData.append('image', file)
      formData.append('userId', userId)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Upload fehlgeschlagen')
      }

      const data = await response.json()

      // Update local state mit der neuen Bild-URL
      setProfileImage(data.imageUrl)
      setPreviewImage(null)

      // Session aktualisieren damit das Bild überall erscheint
      await update({ image: data.imageUrl })

      toast.success(t.profile.imageUploaded)
    } catch (error: any) {
      console.error('Error uploading profile image:', error)
      toast.error(error.message || t.profile.imageUploadError)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    const userId = (session?.user as { id?: string })?.id
    if (!userId) {
      toast.error(t.profile.notLoggedIn)
      return
    }

    try {
      // Entferne vom Server
      const response = await fetch('/api/profile/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Fehler beim Entfernen')
      }

      // Update local state
      setProfileImage(null)
      setPreviewImage(null)

      // Session aktualisieren
      await update({ image: null })

      toast.success(t.profile.imageRemoved)
    } catch (error: any) {
      console.error('Error removing profile image:', error)
      toast.error(error.message || t.profile.imageRemoveError)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error(t.profile.nameRequired)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname,
          bio: formData.bio?.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Session aktualisieren, damit nickname sofort verfügbar ist
        await update()
        toast.success(t.profile.profileSaved)
        // Kurz warten, dann zur Hauptseite
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        toast.error(data.message || t.profile.profileSaveError)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(t.profile.profileSaveError)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    // Validierung
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError('Bitte füllen Sie alle Felder aus')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    if (!/\d/.test(passwordData.newPassword)) {
      setPasswordError('Das neue Passwort muss mindestens eine Zahl enthalten')
      return
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)) {
      setPasswordError('Das neue Passwort muss mindestens ein Sonderzeichen enthalten')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess('Passwort erfolgreich geändert!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => {
          setShowPasswordForm(false)
          setPasswordSuccess('')
        }, 2000)
      } else {
        setPasswordError(data.message || 'Ein Fehler ist aufgetreten')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError(t.profile.passwordChangeError)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">{t.common.loading}</div>
        <Footer />
      </>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t.header.profile}</h1>
          {isVerified === true && (
            <div className="flex items-center rounded-lg border border-green-300 bg-green-100 px-3 py-2 sm:px-4">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 sm:text-base">{t.profile.verified || 'Konto verifiziert'}</span>
              {verifiedAt && (
                <span className="ml-2 hidden text-sm text-green-600 sm:inline">
                  (seit {new Date(verifiedAt).toLocaleDateString('de-CH')})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-600 text-white sm:h-24 sm:w-24">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profilbild Vorschau"
                      className="h-full w-full object-cover"
                    />
                  ) : profileImage ? (
                    <img src={profileImage} alt="Profilbild" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold sm:text-2xl">
                      {getInitials(session.user?.name)}
                    </span>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-white">{t.profile.changeImage}</span>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 p-1.5 text-white shadow-lg transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:h-9 sm:w-9"
                  title={t.profile.changeProfileImage}
                  aria-label={t.profile.changeProfileImage}
                >
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{t.profile.profileImage}</h3>
                {(formData.nickname || session.user?.name) && (
                  <div className="mb-2">
                    <p className="text-lg font-medium text-gray-900">
                      {formData.nickname || session.user?.name}
                    </p>
                    {positivePercentage !== null && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xl font-bold text-primary-600 sm:text-2xl">
                          {positivePercentage}%
                        </span>
                        <span className="text-sm text-gray-600">{t.profile.positiveRatings}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="mb-4 text-xs text-gray-600 sm:text-sm">
                  {t.profile.imageDescription}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {previewImage ? (
                    <>
                      <button
                        onClick={handleImageUpload}
                        disabled={isUploading}
                        className="min-h-[44px] rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                          boxShadow: '0px 4px 16px rgba(20, 184, 166, 0.25)',
                        }}
                      >
                        {isUploading ? t.profile.uploadImage : t.profile.saveImage}
                      </button>
                      <button
                        onClick={() => {
                          setPreviewImage(null)
                          fileInputRef.current!.value = ''
                        }}
                        className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        {t.common.cancel}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Camera className="mr-2 inline-block h-4 w-4" />
                        {t.profile.changeProfileImage}
                      </button>
                      {profileImage && (
                        <button
                          onClick={handleRemoveImage}
                          className="text-sm text-gray-500 transition-colors hover:text-red-600"
                        >
                          {t.profile.removeImage}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Form Card */}
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">{t.profile.profileInformation}</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.profile.name}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t.profile.fullNamePlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.profile.nickname}</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t.profile.nicknamePlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.profile.bio}</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t.profile.bioPlaceholder}
                />
                <p className="mt-1 text-xs text-gray-500">{t.profile.bioHint}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.profile.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.profile.emailCannotChange}
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full min-h-[44px] rounded-md bg-primary-600 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {isSaving ? t.profile.saving : t.profile.saveProfile}
              </button>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">{t.profile.security}</h2>
                <p className="text-sm text-gray-600">
                  {t.profile.securityDescription}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm)
                  setPasswordError('')
                  setPasswordSuccess('')
                  if (!showPasswordForm) {
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }
                }}
                className="min-h-[44px] w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
              >
                {showPasswordForm ? t.profile.hide : t.profile.changePassword}
              </button>
            </div>

            {showPasswordForm && (
              <div className="space-y-4 border-t pt-6">
                {passwordError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t.profile.currentPassword}
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t.profile.currentPasswordPlaceholder}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t.profile.newPasswordPlaceholder}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t.profile.passwordRequirement}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t.profile.confirmPassword}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t.profile.confirmPasswordPlaceholder}
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full min-h-[44px] rounded-md bg-primary-600 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  {isChangingPassword ? t.profile.passwordChanging : t.profile.changePassword}
                </button>
              </div>
            )}
          </Card>

          {/* Einstellungen Links */}
          <div className="mt-6 space-y-3">
            {/* Benutzerkonto / Account Settings */}
            <Card className="p-4">
              <Link
                href="/my-watches/account"
                className="flex items-center justify-between text-gray-700 hover:text-primary-600"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{t.profile.accountSettings}</p>
                    <p className="text-sm text-gray-500">
                      {t.profile.accountSettingsDesc}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </Card>

            {/* Benachrichtigungen */}
            <Card className="p-4">
              <Link
                href="/settings/notifications"
                className="flex items-center justify-between text-gray-700 hover:text-primary-600"
              >
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{t.profile.notifications}</p>
                    <p className="text-sm text-gray-500">
                      {t.profile.notificationsDesc}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </Card>

            {/* Datenschutz */}
            <Card className="p-4">
              <Link
                href="/settings/privacy"
                className="flex items-center justify-between text-gray-700 hover:text-primary-600"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Datenschutz & Daten</p>
                    <p className="text-sm text-gray-500">
                      Daten exportieren, Cookie-Einstellungen, Konto löschen
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </Card>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
