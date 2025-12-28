import { authOptions } from '@/lib/auth'
import { maskIban } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

/**
 * GET /api/stripe/connect/prefill-data
 * Returns the user's existing Helvenda data that can be used in Stripe onboarding
 * This helps users by showing them what data they already have stored
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        paymentMethods: true,
        payoutProfile: {
          select: {
            accountHolderName: true,
            ibanLast4: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Parse bank data from paymentMethods (stored during verification)
    let bankData: {
      accountHolderName: string | null
      ibanMasked: string | null
      bank: string | null
    } | null = null

    // First check PayoutProfile (more reliable, encrypted)
    if (user.payoutProfile) {
      bankData = {
        accountHolderName: user.payoutProfile.accountHolderName,
        ibanMasked: maskIban('', user.payoutProfile.ibanLast4 || undefined),
        bank: null,
      }
    }

    // Also check paymentMethods JSON for additional info
    if (user.paymentMethods) {
      try {
        const methods = JSON.parse(user.paymentMethods)
        const bankMethod = methods.find((pm: any) => pm.type === 'bank')
        if (bankMethod) {
          // If we don't have payoutProfile data, use paymentMethods
          if (!bankData) {
            const accountHolderName = [
              bankMethod.accountHolderFirstName,
              bankMethod.accountHolderLastName,
            ]
              .filter(Boolean)
              .join(' ')

            bankData = {
              accountHolderName: accountHolderName || null,
              ibanMasked: bankMethod.iban
                ? maskIban(bankMethod.iban.replace(/\s/g, ''))
                : null,
              bank: bankMethod.bank || null,
            }
          } else {
            // Add bank name if available
            bankData.bank = bankMethod.bank || null
          }
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Build address string
    const address = [user.street, user.streetNumber, user.postalCode, user.city]
      .filter(Boolean)
      .join(', ')

    return NextResponse.json({
      personalData: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString('de-CH')
          : null,
        address: address || null,
      },
      bankData,
      hasBankData: !!bankData,
    })
  } catch (error: any) {
    console.error('[prefill-data] Error:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Daten' }, { status: 500 })
  }
}
