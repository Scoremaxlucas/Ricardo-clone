'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, X } from 'lucide-react'
import Image from 'next/image'
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
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    nickname: session?.user?.nickname || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lade Nickname aus DB, falls nicht in Session
  useEffect(() => {
    if (session?.user?.id && !session.user.nickname) {
      fetch(`/api/user/nickname?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.nickname) {
            setFormData(prev => ({ ...prev, nickname: data.nickname }))
          }
        })
        .catch(err => console.error('Error loading nickname:', err))
    }
  }, [session?.user?.id])

  // Lade Verifizierungsstatus und Bewertungsstatistiken
  useEffect(() => {
    if (session?.user?.id) {
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
      fetch(`/api/users/${session.user.id}/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.stats?.positivePercentage !== null && data.stats?.positivePercentage !== undefined) {
            setPositivePercentage(data.stats.positivePercentage)
          }
        })
        .catch(err => console.error('Error loading user stats:', err))
    }
  }, [session?.user?.id])

  // Initialisiere Formular und Profilbild
  useEffect(() => {
    // Formular-Daten aktualisieren
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        nickname: session.user.nickname || ''
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
      [e.target.name]: e.target.value
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
          nickname: formData.nickname
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
      [e.target.name]: e.target.value
    })
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    // Validierung
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
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
          newPassword: passwordData.newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess('Passwort erfolgreich geändert!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-sm text-gray-600 mb-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Zurück zur Hauptseite
          </Link>
        </div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mein Profil
          </h1>
          {isVerified === true && (
            <div className="flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Konto verifiziert</span>
              {verifiedAt && (
                <span className="text-green-600 text-sm ml-2">
                  (seit {new Date(verifiedAt).toLocaleDateString('de-CH')})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Profilbild */}
          <div className="flex items-center space-x-6 pb-6 border-b">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profilbild Vorschau"
                    className="w-full h-full object-cover"
                  />
                ) : profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profilbild"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold">
                    {getInitials(session.user?.name)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors shadow-lg"
                title="Profilbild ändern"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Profilbild
              </h3>
              {(formData.nickname || session.user?.name) && (
                <div className="mb-2">
                  <p className="text-lg font-medium text-gray-900">
                    {formData.nickname || session.user?.name}
                  </p>
                  {positivePercentage !== null && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-2xl font-bold text-primary-600">
                        {positivePercentage}%
                      </span>
                      <span className="text-sm text-gray-600">
                        positive Bewertungen
                      </span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">
                Klicken Sie auf das Kamera-Icon, um Ihr Profilbild zu ändern. Unterstützte Formate: JPG, PNG, GIF (max. 5MB)
              </p>
              <div className="flex gap-2">
                {previewImage && (
                  <>
                    <button
                      onClick={handleImageUpload}
                      disabled={isUploading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isUploading ? 'Wird hochgeladen...' : 'Speichern'}
                    </button>
                    <button
                      onClick={() => {
                        setPreviewImage(null)
                        fileInputRef.current!.value = ''
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    >
                      Abbrechen
                    </button>
                  </>
                )}
                {profileImage && !previewImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Entfernen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="Ihr vollständiger Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nickname
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              placeholder="Ihr Nickname (wird im Header angezeigt)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ihr Nickname wird im Header angezeigt (z.B. "Hallo, Administrator2000")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Die E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Wird gespeichert...' : 'Profil speichern'}
          </button>
        </div>

        {/* Passwort ändern Sektion */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Passwort ändern
              </h2>
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
                    confirmPassword: ''
                  })
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              {showPasswordForm ? 'Ausblenden' : 'Passwort ändern'}
            </button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 border-t pt-6">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Geben Sie Ihr aktuelles Passwort ein"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Mindestens 6 Zeichen, eine Zahl und ein Sonderzeichen"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mindestens 6 Zeichen, eine Zahl und ein Sonderzeichen erforderlich
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neues Passwort bestätigen
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Bestätigen Sie Ihr neues Passwort"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Wird geändert...' : 'Passwort ändern'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
