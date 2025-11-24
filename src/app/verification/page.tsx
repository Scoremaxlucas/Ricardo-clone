'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, CreditCard, Smartphone, Building2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

type PaymentMethodType = 'twint' | 'bank' | 'creditcard' | null

interface PaymentMethod {
  type: PaymentMethodType
  phone?: string // für TWINT
  iban?: string // für Banküberweisung
  accountHolderFirstName?: string // für Banküberweisung
  accountHolderLastName?: string // für Banküberweisung
  bank?: string // für Banküberweisung
  creditCardData?: any // für Kreditkarte (später)
}

export default function VerificationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  // Persönliche Daten
  const [title, setTitle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Wohnadresse
  const [street, setStreet] = useState('')
  const [streetNumber, setStreetNumber] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')

  // Lieferadresse (optional)
  const [hasDeliveryAddress, setHasDeliveryAddress] = useState(false)
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryStreetNumber, setDeliveryStreetNumber] = useState('')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryCountry, setDeliveryCountry] = useState('')

  // Geburtsdatum
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Ausweiskopie
  const [idDocument, setIdDocument] = useState<File | null>(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null)
  const [idDocumentBase64, setIdDocumentBase64] = useState<string | null>(null)
  const [idDocumentPage1, setIdDocumentPage1] = useState<File | null>(null)
  const [idDocumentPage1Preview, setIdDocumentPage1Preview] = useState<string | null>(null)
  const [idDocumentPage1Base64, setIdDocumentPage1Base64] = useState<string | null>(null)
  const [idDocumentPage2, setIdDocumentPage2] = useState<File | null>(null)
  const [idDocumentPage2Preview, setIdDocumentPage2Preview] = useState<string | null>(null)
  const [idDocumentPage2Base64, setIdDocumentPage2Base64] = useState<string | null>(null)
  const [idDocumentType, setIdDocumentType] = useState<'ID' | 'Passport' | ''>('')

  // Zahlungsmittel
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>([])

  // Laden der bestehenden Verifizierungsdaten
  useEffect(() => {
    const loadVerificationData = async () => {
      if (!session?.user?.id) return

      try {
        const res = await fetch('/api/verification/get')
        if (res.ok) {
          const data = await res.json()
          if (data.verified) {
            setIsVerified(true)
            // Lade bestehende Daten falls vorhanden
            if (data.user) {
              setTitle(data.user.title || '')
              setFirstName(data.user.firstName || '')
              setLastName(data.user.lastName || '')
              setStreet(data.user.street || '')
              setStreetNumber(data.user.streetNumber || '')
              setPostalCode(data.user.postalCode || '')
              setCity(data.user.city || '')
              setCountry(data.user.country || '')
              setDateOfBirth(data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : '')
              setIdDocumentType((data.user.idDocumentType as 'ID' | 'Passport') || '')
              
              // Lade Ausweiskopie-Vorschau falls vorhanden
              const loadDocumentPreview = (base64String: string | null, setPreview: (preview: string | null) => void, setFile: (file: File | null) => void, setBase64: (base64: string | null) => void, filename: string) => {
                if (!base64String) return
                // Setze Base64-String
                setBase64(base64String)
                // Prüfe ob es ein Bild ist (Base64 startet mit data:image)
                if (base64String.startsWith('data:image/')) {
                  setPreview(base64String)
                  // Erstelle ein File-Objekt für den State (für Validierung)
                  fetch(base64String)
                    .then(res => res.blob())
                    .then(blob => {
                      const file = new File([blob], filename, { type: blob.type })
                      setFile(file)
                    })
                    .catch(err => console.error('Error loading document:', err))
                } else {
                  setPreview(null)
                }
              }
              
              // Reisepass (einzelnes Dokument)
              if (data.user.idDocument) {
                loadDocumentPreview(data.user.idDocument, setIdDocumentPreview, setIdDocument, setIdDocumentBase64, 'passport.jpg')
              }
              
              // Identitätskarte Seite 1
              if (data.user.idDocumentPage1) {
                loadDocumentPreview(data.user.idDocumentPage1, setIdDocumentPage1Preview, setIdDocumentPage1, setIdDocumentPage1Base64, 'id-page1.jpg')
              }
              
              // Identitätskarte Seite 2
              if (data.user.idDocumentPage2) {
                loadDocumentPreview(data.user.idDocumentPage2, setIdDocumentPage2Preview, setIdDocumentPage2, setIdDocumentPage2Base64, 'id-page2.jpg')
              }
              
              if (data.user.deliveryStreet) {
                setHasDeliveryAddress(true)
                setDeliveryStreet(data.user.deliveryStreet || '')
                setDeliveryStreetNumber(data.user.deliveryStreetNumber || '')
                setDeliveryPostalCode(data.user.deliveryPostalCode || '')
                setDeliveryCity(data.user.deliveryCity || '')
                setDeliveryCountry(data.user.deliveryCountry || '')
              }

              // Lade Zahlungsmittel
              if (data.user.paymentMethods) {
                try {
                  const methods = JSON.parse(data.user.paymentMethods)
                  setSelectedPaymentMethods(methods || [])
                } catch (e) {
                  console.error('Error parsing payment methods:', e)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading verification data:', error)
      }
    }

    if (session?.user) {
      loadVerificationData()
    }
  }, [session?.user])

  const togglePaymentMethod = (type: PaymentMethodType) => {
    setSelectedPaymentMethods(prev => {
      const exists = prev.find(pm => pm.type === type)
      if (exists) {
        return prev.filter(pm => pm.type !== type)
      } else {
        return [...prev, { type }]
      }
    })
  }

  // Formatierung für IBAN: CH12 3456 7890 1234 5678 9
  const formatIBAN = (value: string): string => {
    // Entferne alle Leerzeichen, Bindestriche und andere Leerzeichen, konvertiere zu Großbuchstaben
    const cleaned = value.replace(/[\s\-]/g, '').toUpperCase()
    
    // Begrenze auf 21 Zeichen (CH + 2 Ziffern + 19 alphanumerische Zeichen)
    const limited = cleaned.slice(0, 21)
    
    // Füge Leerzeichen alle 4 Zeichen ein (CH12 ist der erste Block mit 4 Zeichen)
    let formatted = ''
    for (let i = 0; i < limited.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' '
      }
      formatted += limited[i]
    }
    
    return formatted.trim()
  }

  const updatePaymentMethod = (type: PaymentMethodType, data: Partial<PaymentMethod>) => {
    setSelectedPaymentMethods(prev =>
      prev.map(pm =>
        pm.type === type ? { ...pm, ...data } : pm
      )
    )
    // Setze Fehler zurück, wenn IBAN oder andere Zahlungsmittel-Daten geändert werden
    if (type === 'bank' && (data.iban !== undefined || data.accountHolderFirstName !== undefined || data.accountHolderLastName !== undefined || data.bank !== undefined)) {
      setError('')
    }
    if (type === 'twint' && data.phone !== undefined) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    console.log('Form Submit - Ausweistyp vor Validierung:', {
      idDocumentType: idDocumentType,
      value: idDocumentType,
      isEmpty: !idDocumentType || idDocumentType === ''
    })

    // Validierung
    if (!title || !firstName || !lastName || !street || !streetNumber || !postalCode || !city || !country) {
      setError('Bitte füllen Sie alle Pflichtfelder aus')
      setLoading(false)
      return
    }

    // PLZ-Validierung (Schweizer PLZ: 4-stellig, numerisch)
    const postalCodeRegex = /^\d{4}$/
    if (!postalCodeRegex.test(postalCode.trim())) {
      setError('Die PLZ muss aus genau 4 Ziffern bestehen (z.B. 8001)')
      setLoading(false)
      return
    }

    if (!dateOfBirth) {
      setError('Bitte geben Sie Ihr Geburtsdatum an')
      setLoading(false)
      return
    }

    // Prüfe Geburtsdatum (muss in der Vergangenheit liegen)
    const birthDate = new Date(dateOfBirth)
    if (birthDate >= new Date()) {
      setError('Das Geburtsdatum muss in der Vergangenheit liegen')
      setLoading(false)
      return
    }

    // Prüfe Mindestalter (z.B. 18 Jahre)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const actualAge = age - 1
      if (actualAge < 18) {
        setError('Sie müssen mindestens 18 Jahre alt sein')
        setLoading(false)
        return
      }
    } else if (age < 18) {
      setError('Sie müssen mindestens 18 Jahre alt sein')
      setLoading(false)
      return
    }

    // Validierung Lieferadresse
    if (hasDeliveryAddress) {
      if (!deliveryStreet || !deliveryStreetNumber || !deliveryPostalCode || !deliveryCity || !deliveryCountry) {
        setError('Bitte füllen Sie alle Felder der Lieferadresse aus oder deaktivieren Sie die Option')
        setLoading(false)
        return
      }
      // PLZ-Validierung für Lieferadresse
      if (!postalCodeRegex.test(deliveryPostalCode.trim())) {
        setError('Die PLZ der Lieferadresse muss aus genau 4 Ziffern bestehen (z.B. 8001)')
        setLoading(false)
        return
      }
    }

    // Validierung Ausweiskopie
    console.log('Ausweistyp Validierung:', {
      idDocumentType: idDocumentType,
      type: typeof idDocumentType,
      length: idDocumentType?.length,
      isEmpty: !idDocumentType || idDocumentType === '',
      isID: idDocumentType === 'ID',
      isPassport: idDocumentType === 'Passport',
      strictCheck: idDocumentType !== 'ID' && idDocumentType !== 'Passport'
    })
    
    // Prüfe ob ein gültiger Ausweistyp gewählt wurde
    if (!idDocumentType || idDocumentType === '' || idDocumentType.trim() === '' || (idDocumentType !== 'ID' && idDocumentType !== 'Passport')) {
      setError('Bitte wählen Sie einen Ausweistyp aus')
      setLoading(false)
      return
    }

    // Validierung je nach Ausweistyp
    if (idDocumentType === 'ID') {
      // Für Identitätskarte: Seite 1 und Seite 2 sind optional, aber mindestens eine Seite muss hochgeladen sein
      if (!idDocumentPage1 && !idDocumentPage2) {
        setError('Bitte laden Sie mindestens eine Seite Ihrer Identitätskarte hoch (Seite 1 oder Seite 2)')
        setLoading(false)
        return
      }
      
      // Validierung Seite 1 falls hochgeladen
      if (idDocumentPage1) {
        if (idDocumentPage1.size > 5 * 1024 * 1024) {
          setError('Seite 1 der Identitätskarte darf maximal 5 MB groß sein')
          setLoading(false)
          return
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!allowedTypes.includes(idDocumentPage1.type)) {
          setError('Seite 1 der Identitätskarte muss im Format JPG, PNG oder PDF vorliegen')
          setLoading(false)
          return
        }
      }
      
      // Validierung Seite 2 falls hochgeladen
      if (idDocumentPage2) {
        if (idDocumentPage2.size > 5 * 1024 * 1024) {
          setError('Seite 2 der Identitätskarte darf maximal 5 MB groß sein')
          setLoading(false)
          return
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!allowedTypes.includes(idDocumentPage2.type)) {
          setError('Seite 2 der Identitätskarte muss im Format JPG, PNG oder PDF vorliegen')
          setLoading(false)
          return
        }
      }
    } else if (idDocumentType === 'Passport') {
      // Für Reisepass: ein Dokument ist erforderlich
      if (!idDocument) {
        setError('Bitte laden Sie eine Kopie Ihres Reisepasses hoch')
        setLoading(false)
        return
      }
      
      if (idDocument.size > 5 * 1024 * 1024) {
        setError('Die Ausweiskopie darf maximal 5 MB groß sein')
        setLoading(false)
        return
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(idDocument.type)) {
        setError('Die Ausweiskopie muss im Format JPG, PNG oder PDF vorliegen')
        setLoading(false)
        return
      }
    }

    // Validierung Zahlungsmittel
    if (selectedPaymentMethods.length === 0) {
      setError('Bitte wählen Sie mindestens ein Zahlungsmittel aus')
      setLoading(false)
      return
    }

    // Validierung TWINT
    const twintMethod = selectedPaymentMethods.find(pm => pm.type === 'twint')
    if (twintMethod && (!twintMethod.phone || twintMethod.phone.trim() === '')) {
      setError('Bitte geben Sie Ihre Telefonnummer für TWINT an')
      setLoading(false)
      return
    }

    // Validierung Banküberweisung
    const bankMethod = selectedPaymentMethods.find(pm => pm.type === 'bank')
    if (bankMethod) {
      if (!bankMethod.iban || bankMethod.iban.trim() === '') {
        setError('Bitte geben Sie Ihre IBAN für die Banküberweisung an')
        setLoading(false)
        return
      }

      // IBAN-Format-Validierung (CH + 2 Prüfziffern + 17 alphanumerische Zeichen = 21 Zeichen total)
      // Stelle sicher, dass die IBAN formatiert ist
      const ibanFormatted = formatIBAN(bankMethod.iban)
      
      // Entferne alle Leerzeichen, Bindestriche und andere Leerzeichen, konvertiere zu Großbuchstaben
      const ibanCleaned = ibanFormatted.replace(/[\s\-]/g, '').toUpperCase().trim()
      
      console.log('IBAN Validierung:', {
        original: bankMethod.iban,
        formatted: ibanFormatted,
        cleaned: ibanCleaned,
        length: ibanCleaned.length,
        afterCH: ibanCleaned.substring(4),
        afterCHLength: ibanCleaned.substring(4).length,
        matchesPattern: /^CH\d{2}[A-Z0-9]{17}$/.test(ibanCleaned)
      })
      
      // Schweizer IBAN Format: CH + 2 Ziffern + 17 alphanumerische Zeichen = 21 Zeichen total
      const ibanRegex = /^CH\d{2}[A-Z0-9]{17}$/
      
      // Prüfe ob mit CH beginnt
      if (!ibanCleaned.startsWith('CH')) {
        setError(`Die IBAN muss mit "CH" beginnen. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      // Prüfe Gesamtlänge zuerst
      if (ibanCleaned.length < 21) {
        const missingChars = 21 - ibanCleaned.length
        const afterCH = ibanCleaned.substring(4)
        const afterCHLength = afterCH.length
        setError(`Die IBAN ist unvollständig. Erwartet: 21 Zeichen (ohne Leerzeichen), gefunden: ${ibanCleaned.length} Zeichen. Nach "CH" und 2 Prüfziffern sollten 17 Zeichen folgen, gefunden: ${afterCHLength} Zeichen. Es fehlen ${missingChars} Zeichen. Format: CH12 3456 7890 1234 5678 9. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      if (ibanCleaned.length > 21) {
        setError(`Die IBAN ist zu lang. Erwartet: 21 Zeichen (ohne Leerzeichen), gefunden: ${ibanCleaned.length} Zeichen. Format: CH12 3456 7890 1234 5678 9. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      // Prüfe Format: CH + 2 Ziffern + 17 alphanumerische Zeichen
      if (!/^CH/.test(ibanCleaned)) {
        setError(`Die IBAN muss mit "CH" beginnen. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      if (!/^CH\d{2}/.test(ibanCleaned)) {
        setError(`Nach "CH" müssen 2 Ziffern folgen (Prüfziffern). Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      const afterCH = ibanCleaned.substring(4)
      if (afterCH.length !== 17) {
        setError(`Nach "CH" und den 2 Prüfziffern müssen genau 17 alphanumerische Zeichen folgen. Gefunden: ${afterCH.length} Zeichen. Format: CH12 3456 7890 1234 5678 9. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      if (!/^[A-Z0-9]{17}$/.test(afterCH)) {
        setError(`Nach "CH" und den 2 Prüfziffern dürfen nur alphanumerische Zeichen (A-Z, 0-9) folgen. Gefunden: "${afterCH}". Format: CH12 3456 7890 1234 5678 9. Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      // Finale Regex-Validierung
      if (!ibanRegex.test(ibanCleaned)) {
        setError(`Die IBAN hat ein ungültiges Format. Gefunden: "${ibanCleaned}". Erwartetes Format: CH12 3456 7890 1234 5678 9 (Schweizer IBAN: CH + 2 Ziffern + 17 alphanumerische Zeichen). Eingegeben: "${bankMethod.iban}"`)
        setLoading(false)
        return
      }
      
      // Aktualisiere die IBAN mit der formatierten Version
      updatePaymentMethod('bank', { iban: ibanFormatted })

      if (!bankMethod.accountHolderFirstName || !bankMethod.accountHolderLastName) {
        setError('Bitte geben Sie Vor- und Nachname des Kontoinhabers an')
        setLoading(false)
        return
      }
      if (!bankMethod.bank || bankMethod.bank.trim() === '') {
        setError('Bitte geben Sie den Namen der Bank an')
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Persönliche Daten
          title,
          firstName,
          lastName,
          // Wohnadresse
          street,
          streetNumber,
          postalCode,
          city,
          country,
          // Lieferadresse
          hasDeliveryAddress,
          deliveryStreet: hasDeliveryAddress ? deliveryStreet : null,
          deliveryStreetNumber: hasDeliveryAddress ? deliveryStreetNumber : null,
          deliveryPostalCode: hasDeliveryAddress ? deliveryPostalCode : null,
          deliveryCity: hasDeliveryAddress ? deliveryCity : null,
          deliveryCountry: hasDeliveryAddress ? deliveryCountry : null,
          // Geburtsdatum
          dateOfBirth,
          // Ausweiskopie
          idDocument: idDocumentBase64,
          idDocumentPage1: idDocumentPage1Base64,
          idDocumentPage2: idDocumentPage2Base64,
          idDocumentType: idDocumentType || null,
          // Zahlungsmittel
          paymentMethods: selectedPaymentMethods
        })
      })

      console.log('API Response Status:', res.status)
      const data = await res.json()
      console.log('API Response Data:', data)

      if (res.ok) {
        // Weiterleitung zur Hauptseite mit Query-Parameter für Toast
        router.push('/?verificationSubmitted=true')
      } else {
        console.error('API Error Response:', {
          status: res.status,
          message: data.message,
          data: data
        })
        setError(data.message || 'Ein Fehler ist aufgetreten')
      }
    } catch (error: any) {
      console.error('Error submitting verification:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      setError(`Ein Fehler ist aufgetreten: ${error.message || 'Bitte versuchen Sie es erneut.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-600">
          Lädt...
        </div>
        <Footer />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zur Hauptseite
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verifizierung
            </h1>
            <p className="text-gray-600">
              Um kaufen und verkaufen zu können, benötigen wir Ihre Verifizierungsdaten.
            </p>
          </div>

          {isVerified && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Sie sind bereits verifiziert! Sie können Ihre Daten hier aktualisieren.
                </span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Persönliche Daten */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Persönliche Daten</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anrede *
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Wohnadresse */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Wohnadresse</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strasse *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strassen-Nr. *
                  </label>
                  <input
                    type="text"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-1"></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ortschaft *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-1"></div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    placeholder="z.B. Schweiz"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Lieferadresse */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasDeliveryAddress"
                  checked={hasDeliveryAddress}
                  onChange={(e) => setHasDeliveryAddress(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasDeliveryAddress" className="ml-2 text-sm font-medium text-gray-700">
                  Abweichende Lieferadresse
                </label>
              </div>

              {hasDeliveryAddress && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strasse
                    </label>
                    <input
                      type="text"
                      value={deliveryStreet}
                      onChange={(e) => setDeliveryStreet(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strassen-Nr.
                    </label>
                    <input
                      type="text"
                      value={deliveryStreetNumber}
                      onChange={(e) => setDeliveryStreetNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-1"></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={deliveryPostalCode}
                      onChange={(e) => setDeliveryPostalCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ortschaft
                    </label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div className="md:col-span-1"></div>
                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Land
                    </label>
                    <input
                      type="text"
                      value={deliveryCountry}
                      onChange={(e) => setDeliveryCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      placeholder="z.B. Schweiz"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Geburtsdatum */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Geburtsdatum *</h2>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                required
              />
              <p className="mt-2 text-sm text-gray-600">
                Sie müssen mindestens 18 Jahre alt sein, um sich zu verifizieren.
              </p>
            </div>

            {/* Ausweiskopie */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ausweiskopie *</h2>
              <p className="text-sm text-gray-600 mb-4">
                Bitte laden Sie eine Kopie Ihres gültigen Ausweises hoch (Identitätskarte oder Reisepass). Max. 5 MB, Format: JPG, PNG oder PDF.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ausweistyp *
                  </label>
                  <select
                    value={idDocumentType}
                    onChange={(e) => {
                      const selectedValue = e.target.value as 'ID' | 'Passport' | ''
                      console.log('Ausweistyp geändert:', selectedValue)
                      setIdDocumentType(selectedValue)
                      // Lösche alle vorherigen Uploads beim Wechsel
                      if (selectedValue !== 'ID') {
                        setIdDocumentPage1(null)
                        setIdDocumentPage1Preview(null)
                        setIdDocumentPage2(null)
                        setIdDocumentPage2Preview(null)
                      }
                      if (selectedValue !== 'Passport') {
                        setIdDocument(null)
                        setIdDocumentPreview(null)
                      }
                      // Setze Fehler zurück
                      setError('')
                    }}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  >
                    <option value="">Bitte wählen</option>
                    <option value="ID">Identitätskarte (ID)</option>
                    <option value="Passport">Reisepass</option>
                  </select>
                </div>

                {/* Reisepass: Einzelnes Dokument */}
                {idDocumentType === 'Passport' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reisepass hochladen *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setIdDocument(file)
                          // Erstelle Preview und Base64 für Bilder
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const base64 = reader.result as string
                            setIdDocumentBase64(base64)
                            if (file.type.startsWith('image/')) {
                              setIdDocumentPreview(base64)
                            } else {
                              setIdDocumentPreview(null)
                            }
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      required
                    />
                    {idDocumentPreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Vorschau:</p>
                        <img
                          src={idDocumentPreview}
                          alt="Reisepass Vorschau"
                          className="max-w-md border border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                    {idDocument && !idDocumentPreview && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Datei:</span> {idDocument.name} ({(idDocument.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Identitätskarte: Seite 1 und Seite 2 */}
                {idDocumentType === 'ID' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Identitätskarte - Seite 1
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setIdDocumentPage1(file)
                            // Erstelle Preview und Base64 für Bilder
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              const base64 = reader.result as string
                              setIdDocumentPage1Base64(base64)
                              if (file.type.startsWith('image/')) {
                                setIdDocumentPage1Preview(base64)
                              } else {
                                setIdDocumentPage1Preview(null)
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {idDocumentPage1Preview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Vorschau Seite 1:</p>
                          <img
                            src={idDocumentPage1Preview}
                            alt="ID Seite 1 Vorschau"
                            className="max-w-md border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                      {idDocumentPage1 && !idDocumentPage1Preview && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Datei:</span> {idDocumentPage1.name} ({(idDocumentPage1.size / 1024).toFixed(2)} KB)
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Identitätskarte - Seite 2
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setIdDocumentPage2(file)
                            // Erstelle Preview und Base64 für Bilder
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              const base64 = reader.result as string
                              setIdDocumentPage2Base64(base64)
                              if (file.type.startsWith('image/')) {
                                setIdDocumentPage2Preview(base64)
                              } else {
                                setIdDocumentPage2Preview(null)
                              }
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {idDocumentPage2Preview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Vorschau Seite 2:</p>
                          <img
                            src={idDocumentPage2Preview}
                            alt="ID Seite 2 Vorschau"
                            className="max-w-md border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                      {idDocumentPage2 && !idDocumentPage2Preview && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded-md">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Datei:</span> {idDocumentPage2.name} ({(idDocumentPage2.size / 1024).toFixed(2)} KB)
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {(!idDocumentPage1 && !idDocumentPage2) && (
                      <p className="text-sm text-gray-500 italic">
                        Bitte laden Sie mindestens eine Seite der Identitätskarte hoch.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Zahlungsmittel */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Zahlungsmittel *</h2>
              <p className="text-sm text-gray-600 mb-4">
                Wählen Sie mindestens ein Zahlungsmittel aus und füllen Sie die entsprechenden Informationen aus:
              </p>

              <div className="space-y-4">
                {/* TWINT */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="payment-twint"
                      checked={selectedPaymentMethods.some(pm => pm.type === 'twint')}
                      onChange={() => togglePaymentMethod('twint')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="payment-twint" className="ml-3 flex items-center">
                      <Smartphone className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">TWINT</span>
                    </label>
                  </div>
                  {selectedPaymentMethods.some(pm => pm.type === 'twint') && (
                    <div className="ml-7 mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefonnummer *
                      </label>
                      <input
                        type="tel"
                        value={selectedPaymentMethods.find(pm => pm.type === 'twint')?.phone || ''}
                        onChange={(e) => updatePaymentMethod('twint', { phone: e.target.value })}
                        placeholder="+41 79 123 45 67"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                      />
                    </div>
                  )}
                </div>

                {/* Banküberweisung */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="payment-bank"
                      checked={selectedPaymentMethods.some(pm => pm.type === 'bank')}
                      onChange={() => togglePaymentMethod('bank')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="payment-bank" className="ml-3 flex items-center">
                      <Building2 className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-900">Banküberweisung</span>
                    </label>
                  </div>
                  {selectedPaymentMethods.some(pm => pm.type === 'bank') && (
                    <div className="ml-7 mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IBAN *
                        </label>
                        <input
                          type="text"
                          value={selectedPaymentMethods.find(pm => pm.type === 'bank')?.iban || ''}
                          onChange={(e) => {
                            // Setze Fehler sofort zurück, wenn der Benutzer tippt
                            setError('')
                            // Formatiere IBAN automatisch mit Leerzeichen
                            const formatted = formatIBAN(e.target.value)
                            updatePaymentMethod('bank', { iban: formatted })
                          }}
                          onBlur={(e) => {
                            // Optional: Validiere beim Verlassen des Feldes (nur für Feedback, keine Blockade)
                            const ibanValue = e.target.value
                            if (ibanValue) {
                              const ibanCleaned = ibanValue.replace(/[\s\-]/g, '').toUpperCase().trim()
                              const ibanRegex = /^CH\d{2}[A-Z0-9]{19}$/
                              if (ibanCleaned.length === 21 && ibanRegex.test(ibanCleaned)) {
                                // IBAN ist korrekt - keine Fehlermeldung
                                setError('')
                              }
                            }
                          }}
                          placeholder="CH12 3456 7890 1234 5678 9"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                          style={{ letterSpacing: '0.05em' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vorname Kontoinhaber *
                          </label>
                          <input
                            type="text"
                            value={selectedPaymentMethods.find(pm => pm.type === 'bank')?.accountHolderFirstName || ''}
                            onChange={(e) => updatePaymentMethod('bank', { accountHolderFirstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nachname Kontoinhaber *
                          </label>
                          <input
                            type="text"
                            value={selectedPaymentMethods.find(pm => pm.type === 'bank')?.accountHolderLastName || ''}
                            onChange={(e) => updatePaymentMethod('bank', { accountHolderLastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank *
                        </label>
                        <input
                          type="text"
                          value={selectedPaymentMethods.find(pm => pm.type === 'bank')?.bank || ''}
                          onChange={(e) => updatePaymentMethod('bank', { bank: e.target.value })}
                          placeholder="z.B. UBS, Credit Suisse, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Kreditkarte */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="payment-creditcard"
                      checked={selectedPaymentMethods.some(pm => pm.type === 'creditcard')}
                      onChange={() => togglePaymentMethod('creditcard')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="payment-creditcard" className="ml-3 flex items-center">
                      <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-900">Kreditkarte</span>
                    </label>
                  </div>
                  {selectedPaymentMethods.some(pm => pm.type === 'creditcard') && (
                    <div className="ml-7 mt-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          Die Kreditkarten-Funktion wird zu einem späteren Zeitpunkt verfügbar sein.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link
                href="/"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gespeichert...' : isVerified ? 'Aktualisieren' : 'Verifizierung abschliessen'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}

