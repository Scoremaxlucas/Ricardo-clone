'use client'

import { BadgesSection } from '@/components/profile/BadgesSection'
import { RewardDisplay } from '@/components/user/RewardDisplay'
import { Card } from '@/components/ui/Card'
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications'
import { Award, Camera, CheckCircle, Lock, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
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

  // Badge-Notifications (Feature 9)
  const userId = (session?.user as { id?: string })?.id
  useBadgeNotifications(userId)

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    nickname: (session?.user as { nickname?: string | null })?.nickname || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // Lade Bewertungsstatistiken
      fetch(`/api/users/${userId}/stats`)
        .then(res => res.json())
        .then(data => {
          if (
            data.stats?.positivePercentage !== null &&
            data.stats?.positivePercentage !== undefined
          ) {
            setPositivePercentage(data.stats.positivePercentage)
          }
        })
        .catch(err => console.error('Error loading user stats:', err))
    }
  }, [(session?.user as { id?: string })?.id])

  // Initialisiere Formular und Profilbild
  useEffect(() => {
    // Formular-Daten aktualisieren
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        nickname: (session.user as { nickname?: string | null })?.nickname || '',
      })
    }

    // Profilbild aus localStorage laden
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem('profileImage')
      if (storedImage) {
        setProfileImage(storedImage)
        return
      }
    }

    // Dann aus Session
    if (session?.user?.image) {
      setProfileImage(session.user.image)
    }
  }, [session?.user?.name, session?.user?.email, session?.user?.image])

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
        toast.error('Bitte wählen Sie ein Bild aus')
        return
      }

      // Prüfe Dateigröße (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Das Bild ist zu groß. Maximale Größe: 5MB')
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

    setIsUploading(true)
    const file = fileInputRef.current.files[0]

    // Konvertiere zu Base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Image = reader.result as string
      setProfileImage(base64Image)
      setPreviewImage(null)

      // In localStorage speichern
      if (typeof window !== 'undefined') {
        localStorage.setItem('profileImage', base64Image)
      }

      toast.success('Profilbild erfolgreich aktualisiert!')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfileImage(null)
    setPreviewImage(null)

    // Aus localStorage entfernen
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileImage')
    }

    toast.success('Profilbild entfernt')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein')
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
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Session aktualisieren, damit nickname sofort verfügbar ist
        await update()
        toast.success('Profil erfolgreich gespeichert!')
        // Kurz warten, dann zur Hauptseite
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        toast.error(data.message || 'Ein Fehler ist aufgetreten')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
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

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein')
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
      setPasswordError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Zurück zur Hauptseite
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mein Profil</h1>
          {isVerified === true && (
            <div className="flex items-center rounded-lg border border-green-300 bg-green-100 px-3 py-2 sm:px-4">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 sm:text-base">Konto verifiziert</span>
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
                    <span className="text-xs font-medium text-white">Ändern</span>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 p-1.5 text-white shadow-lg transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:h-9 sm:w-9"
                  title="Profilbild ändern"
                  aria-label="Profilbild ändern"
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
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Profilbild</h3>
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
                        <span className="text-sm text-gray-600">positive Bewertungen</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="mb-4 text-xs text-gray-600 sm:text-sm">
                  Klicken Sie auf das Kamera-Icon, um Ihr Profilbild zu ändern. Unterstützte Formate:
                  JPG, PNG, GIF (max. 5MB)
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewImage && (
                    <>
                      <button
                        onClick={handleImageUpload}
                        disabled={isUploading}
                        className="min-h-[44px] rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? 'Wird hochgeladen...' : 'Speichern'}
                      </button>
                      <button
                        onClick={() => {
                          setPreviewImage(null)
                          fileInputRef.current!.value = ''
                        }}
                        className="min-h-[44px] rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                      >
                        Abbrechen
                      </button>
                    </>
                  )}
                  {profileImage && !previewImage && (
                    <button
                      onClick={handleRemoveImage}
                      className="flex min-h-[44px] items-center gap-1 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      <X className="h-4 w-4" />
                      Entfernen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Form Card */}
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Profilinformationen</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ihr vollständiger Name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ihr Nickname (wird im Header angezeigt)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ihr Nickname wird im Header angezeigt (z.B. "Hallo, Administrator2000")
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Die E-Mail-Adresse kann nicht geändert werden
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full min-h-[44px] rounded-md bg-primary-600 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {isSaving ? 'Speichert...' : 'Profil speichern'}
              </button>
            </div>
          </Card>

          {/* Badges Section */}
          {userId && (
            <Card className="p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Badges & Fortschritt</h2>
              </div>
              <BadgesSection userId={userId} />
            </Card>
          )}

          {/* Rewards Section */}
          {userId && (
            <Card className="p-4 sm:p-6">
              <RewardDisplay userId={userId} showTitle={true} />
            </Card>
          )}

          {/* Security Card */}
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">Sicherheit</h2>
                <p className="text-sm text-gray-600">
                  Ändern Sie Ihr Passwort für zusätzliche Sicherheit
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
                {showPasswordForm ? 'Ausblenden' : 'Passwort ändern'}
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
                    Aktuelles Passwort
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Geben Sie Ihr aktuelles Passwort ein"
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
                    placeholder="Mindestens 6 Zeichen, eine Zahl und ein Sonderzeichen"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Mindestens 6 Zeichen, eine Zahl und ein Sonderzeichen erforderlich
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Neues Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Bestätigen Sie Ihr neues Passwort"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full min-h-[44px] rounded-md bg-primary-600 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  {isChangingPassword ? 'Wird geändert...' : 'Passwort ändern'}
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
