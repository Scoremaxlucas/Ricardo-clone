import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'
import { getIbanLast4 } from '@/lib/iban-validator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      firstName,
      lastName,
      street,
      streetNumber,
      postalCode,
      city,
      country,
      hasDeliveryAddress,
      deliveryStreet,
      deliveryStreetNumber,
      deliveryPostalCode,
      deliveryCity,
      deliveryCountry,
      dateOfBirth,
      idDocument,
      idDocumentPage1,
      idDocumentPage2,
      idDocumentType,
      paymentMethods,
    } = body

    // Validierung
    if (
      !title ||
      !firstName ||
      !lastName ||
      !street ||
      !streetNumber ||
      !postalCode ||
      !city ||
      !country
    ) {
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

    // Validierung Ausweiskopie
    console.log('API - Ausweistyp Validierung:', {
      idDocumentType: idDocumentType,
      type: typeof idDocumentType,
      isEmpty: !idDocumentType || idDocumentType === '',
      hasID: !!idDocument,
      hasPage1: !!idDocumentPage1,
      hasPage2: !!idDocumentPage2,
    })

    if (
      !idDocumentType ||
      idDocumentType === '' ||
      (idDocumentType !== 'ID' && idDocumentType !== 'Passport')
    ) {
      console.error('API - Ausweistyp fehlt oder ist ungültig:', idDocumentType)
      return NextResponse.json(
        { message: 'Bitte wählen Sie einen Ausweistyp aus' },
        { status: 400 }
      )
    }

    if (idDocumentType === 'ID') {
      // Für Identitätskarte: mindestens eine Seite muss hochgeladen sein
      if (!idDocumentPage1 && !idDocumentPage2) {
        return NextResponse.json(
          {
            message:
              'Bitte laden Sie mindestens eine Seite Ihrer Identitätskarte hoch (Seite 1 oder Seite 2)',
          },
          { status: 400 }
        )
      }
    } else if (idDocumentType === 'Passport') {
      // Für Reisepass: ein Dokument ist erforderlich
      if (!idDocument) {
        return NextResponse.json(
          { message: 'Bitte laden Sie eine Kopie Ihres Reisepasses hoch' },
          { status: 400 }
        )
      }
    }

    // PLZ-Validierung (Schweizer PLZ: 4-stellig, numerisch)
    const postalCodeRegex = /^\d{4}$/
    if (!postalCodeRegex.test(postalCode.trim())) {
      return NextResponse.json(
        { message: 'Die PLZ muss aus genau 4 Ziffern bestehen (z.B. 8001)' },
        { status: 400 }
      )
    }

    // Lieferadresse validieren falls vorhanden
    if (hasDeliveryAddress) {
      if (
        !deliveryStreet ||
        !deliveryStreetNumber ||
        !deliveryPostalCode ||
        !deliveryCity ||
        !deliveryCountry
      ) {
        return NextResponse.json(
          {
            message:
              'Bitte füllen Sie alle Felder der Lieferadresse aus oder deaktivieren Sie die Option',
          },
          { status: 400 }
        )
      }
      if (deliveryPostalCode && !postalCodeRegex.test(deliveryPostalCode.trim())) {
        return NextResponse.json(
          { message: 'Die PLZ der Lieferadresse muss aus genau 4 Ziffern bestehen (z.B. 8001)' },
          { status: 400 }
        )
      }
    }

    if (!dateOfBirth) {
      return NextResponse.json({ message: 'Bitte geben Sie Ihr Geburtsdatum an' }, { status: 400 })
    }

    // Prüfe Geburtsdatum
    const birthDate = new Date(dateOfBirth)
    if (birthDate >= new Date()) {
      return NextResponse.json(
        { message: 'Das Geburtsdatum muss in der Vergangenheit liegen' },
        { status: 400 }
      )
    }

    // Prüfe Mindestalter
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age

    if (actualAge < 18) {
      return NextResponse.json(
        { message: 'Sie müssen mindestens 18 Jahre alt sein' },
        { status: 400 }
      )
    }

    // Validierung Zahlungsmittel
    if (!paymentMethods || paymentMethods.length === 0) {
      return NextResponse.json(
        { message: 'Bitte wählen Sie mindestens ein Zahlungsmittel aus' },
        { status: 400 }
      )
    }

    // Validierung TWINT
    const twintMethod = paymentMethods.find((pm: any) => pm.type === 'twint')
    if (twintMethod && (!twintMethod.phone || twintMethod.phone.trim() === '')) {
      return NextResponse.json(
        { message: 'Bitte geben Sie Ihre Telefonnummer für TWINT an' },
        { status: 400 }
      )
    }

    // Validierung Banküberweisung
    const bankMethod = paymentMethods.find((pm: any) => pm.type === 'bank')
    if (bankMethod) {
      if (!bankMethod.iban || bankMethod.iban.trim() === '') {
        return NextResponse.json(
          { message: 'Bitte geben Sie Ihre IBAN für die Banküberweisung an' },
          { status: 400 }
        )
      }

      // IBAN-Format-Validierung (CH + 2 Prüfziffern + 17 alphanumerische Zeichen = 21 Zeichen total)
      // Entferne alle Leerzeichen und Bindestriche, konvertiere zu Großbuchstaben
      const ibanCleaned = bankMethod.iban.replace(/[\s-]/g, '').toUpperCase().trim()

      // Schweizer IBAN Format: CH + 2 Ziffern + 17 alphanumerische Zeichen = 21 Zeichen total
      const ibanRegex = /^CH\d{2}[A-Z0-9]{17}$/

      if (ibanCleaned.length !== 21) {
        return NextResponse.json(
          {
            message: `Die IBAN hat eine ungültige Länge. Erwartet: 21 Zeichen (ohne Leerzeichen), gefunden: ${ibanCleaned.length} Zeichen. Format: CH12 3456 7890 1234 5678 9`,
          },
          { status: 400 }
        )
      }

      if (!ibanRegex.test(ibanCleaned)) {
        return NextResponse.json(
          {
            message:
              'Die IBAN hat ein ungültiges Format. Bitte verwenden Sie das Format: CH12 3456 7890 1234 5678 9 (Schweizer IBAN: CH + 2 Ziffern + 17 alphanumerische Zeichen)',
          },
          { status: 400 }
        )
      }

      if (!bankMethod.accountHolderFirstName || !bankMethod.accountHolderLastName) {
        return NextResponse.json(
          { message: 'Bitte geben Sie Vor- und Nachname des Kontoinhabers an' },
          { status: 400 }
        )
      }
      if (!bankMethod.bank || bankMethod.bank.trim() === '') {
        return NextResponse.json(
          { message: 'Bitte geben Sie den Namen der Bank an' },
          { status: 400 }
        )
      }
    }

    // Speichere Zahlungsmittel als JSON
    const paymentMethodsJson = JSON.stringify(paymentMethods)

    // Update User
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
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
        deliveryStreet: hasDeliveryAddress ? deliveryStreet : null,
        deliveryStreetNumber: hasDeliveryAddress ? deliveryStreetNumber : null,
        deliveryPostalCode: hasDeliveryAddress ? deliveryPostalCode : null,
        deliveryCity: hasDeliveryAddress ? deliveryCity : null,
        deliveryCountry: hasDeliveryAddress ? deliveryCountry : null,
        // Geburtsdatum
        dateOfBirth: new Date(dateOfBirth),
        // Ausweiskopie
        idDocument: idDocument,
        idDocumentPage1: idDocumentPage1,
        idDocumentPage2: idDocumentPage2,
        idDocumentType: idDocumentType,
        // Zahlungsmittel
        paymentMethods: paymentMethodsJson,
        // Verifizierung
        verified: true,
        verifiedAt: new Date(),
        verificationStatus: 'pending', // Status auf "pending" setzen, bis Admin prüft
      },
    })

    // Wenn Bankdaten vorhanden, automatisch PayoutProfile erstellen
    if (bankMethod) {
      const ibanCleaned = bankMethod.iban.replace(/[\s-]/g, '').toUpperCase()
      const accountHolderName = `${bankMethod.accountHolderFirstName} ${bankMethod.accountHolderLastName}`

      try {
        const ibanEncrypted = encrypt(ibanCleaned)
        const ibanLast4 = getIbanLast4(ibanCleaned)

        await prisma.payoutProfile.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            status: 'ACTIVE',
            accountHolderName,
            ibanEncrypted,
            ibanLast4,
            country: 'CH',
          },
          update: {
            status: 'ACTIVE',
            accountHolderName,
            ibanEncrypted,
            ibanLast4,
          },
        })
        console.log('PayoutProfile erstellt für User:', session.user.id)
      } catch (payoutError: any) {
        console.error('Fehler beim Erstellen des PayoutProfile:', payoutError)
        // Fehler nicht blockierend - User kann später manuell hinzufügen
      }
    }

    return NextResponse.json({
      message:
        'Ihre Verifizierung wurde eingereicht und wird nun von unserem Team geprüft. Sie erhalten eine Benachrichtigung, sobald die Verifizierung abgeschlossen ist.',
      verified: false,
      verificationStatus: 'pending',
    })
  } catch (error: any) {
    console.error('Error submitting verification:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern der Verifizierung: ' + error.message },
      { status: 500 }
    )
  }
}
