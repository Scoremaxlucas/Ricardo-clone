import { isDebug } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const useSecureCookies = process.env.NODE_ENV === 'production'
const nextAuthSharedCookieDomain =
  process.env.NEXTAUTH_COOKIE_DOMAIN ||
  (process.env.VERCEL_ENV === 'production' ? '.helvenda.ch' : undefined)

const crossSubdomainCookies =
  nextAuthSharedCookieDomain != null
    ? {
        cookies: {
          sessionToken: {
            name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: 'lax' as const,
              path: '/',
              secure: useSecureCookies,
              domain: nextAuthSharedCookieDomain,
            },
          },
          callbackUrl: {
            name: `${useSecureCookies ? '__Secure-' : ''}next-auth.callback-url`,
            options: {
              httpOnly: true,
              sameSite: 'lax' as const,
              path: '/',
              secure: useSecureCookies,
              domain: nextAuthSharedCookieDomain,
            },
          },
        },
      }
    : {}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || '',
  adapter: undefined, // Disable adapter for now
  debug: isDebug(), // Enable debug when DEBUG=true or NODE_ENV=development
  // WICHTIG: Trust host für Vercel/Production
  trustHost: true,
  ...crossSubdomainCookies,
  providers: [
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // WICHTIG: Logging für Debugging in Production
        const logPrefix = '[AUTH]'

        try {
          if (!credentials?.email || !credentials?.password) {
            console.log(`${logPrefix} Missing credentials`)
            return null
          }

          // Normalize email (lowercase and trim)
          const normalizedEmail = credentials.email.toLowerCase().trim()

          console.log(`${logPrefix} Attempting login for:`, normalizedEmail)
          console.log(`${logPrefix} Password length:`, credentials.password.length)
          console.log(`${logPrefix} DATABASE_URL exists:`, !!process.env.DATABASE_URL)
          console.log(`${logPrefix} NEXTAUTH_SECRET exists:`, !!process.env.NEXTAUTH_SECRET)

          // WICHTIG: Prisma verbindet sich automatisch beim ersten Query
          // Kein expliziter $connect() nötig - kann in Serverless-Umgebungen Probleme verursachen
          let user
          try {
            user = await prisma.user.findUnique({
              where: {
                email: normalizedEmail,
              },
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                nickname: true,
                image: true,
                password: true,
                isAdmin: true,
                isBlocked: true,
                emailVerified: true,
              },
            })
          } catch (dbError: any) {
            console.error(`${logPrefix} Database query error:`, dbError)
            console.error(`${logPrefix} Database error details:`, {
              message: dbError.message,
              code: dbError.code,
              name: dbError.name,
              stack: dbError.stack?.substring(0, 300),
            })
            // WICHTIG: Bei Datenbankfehlern, return null statt throw
            // NextAuth behandelt null als "invalid credentials"
            // Aber logge es ausführlich für Debugging
            return null
          }

          if (!user) {
            console.log(`${logPrefix} User not found:`, normalizedEmail)
            // WICHTIG: Prüfe ob User mit anderer Groß-/Kleinschreibung existiert (nur für Debugging)
            try {
              const allUsers = await prisma.user.findMany({
                select: { email: true },
                take: 10,
              })
              console.log(
                `${logPrefix} Sample users in database:`,
                allUsers.map(u => u.email)
              )
              console.log(`${logPrefix} Total users found:`, allUsers.length)
            } catch (error: any) {
              console.error(`${logPrefix} Error fetching sample users:`, error.message)
              // Ignore error - nur für Debugging
            }
            return null
          }

          console.log('[AUTH] User found:', normalizedEmail)

          // Check if email is verified
          const isEmailVerified = user.emailVerified === true
          if (!isEmailVerified) {
            console.log('[AUTH] Email not verified:', normalizedEmail)
            // Throw a specific error that the frontend can handle
            throw new Error('EMAIL_NOT_VERIFIED')
          }

          const isAdmin = user.isAdmin === true

          // WICHTIG: Prüfe ob Benutzer blockiert ist
          // Nur explizit blockierte Benutzer werden abgelehnt
          // null, false, 0, oder undefined = nicht blockiert
          // Prüfe explizit auf true (Boolean)
          const isBlocked = user.isBlocked === true

          if (isBlocked) {
            console.log('[AUTH] User is blocked:', normalizedEmail)
            return null
          }

          if (!user.password) {
            console.log('[AUTH] User has no password set:', normalizedEmail)
            return null
          }

          // Passwort-Prüfung: NUR bcrypt, kein direkter Vergleich (Sicherheit!)
          let isPasswordValid = false

          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          } catch (bcryptError) {
            console.error('[AUTH] Bcrypt comparison error for:', normalizedEmail)
            return null
          }

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', normalizedEmail)
            return null
          }

          console.log(
            `${logPrefix} ✅ Login successful for:`,
            normalizedEmail,
            'isAdmin:',
            user.isAdmin
          )

          // WICHTIG: Stelle sicher, dass alle erforderlichen Felder vorhanden sind
          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            nickname: user.nickname || null,
            image: user.image || null,
            isAdmin: user.isAdmin === true,
          }

          console.log(`${logPrefix} Returning user object:`, {
            id: userObject.id,
            email: userObject.email,
            name: userObject.name,
            hasNickname: !!userObject.nickname,
            hasImage: !!userObject.image,
            isAdmin: userObject.isAdmin,
          })

          return userObject
        } catch (error: any) {
          console.error('[AUTH] ❌ Error during authorization:', error)
          console.error('[AUTH] Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack?.substring(0, 500), // Limit stack trace
          })

          // WICHTIG: Bei Datenbankfehlern, versuche trotzdem zu authentifizieren
          // Dies verhindert, dass temporäre DB-Probleme alle Logins blockieren
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Handle Google OAuth sign-in: auto-create or link user
      if (account?.provider === 'google') {
        try {
          const email = user.email?.toLowerCase().trim()
          if (!email) return false

          let dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, isBlocked: true, image: true },
          })

          if (dbUser?.isBlocked) {
            console.log('[AUTH] Google OAuth blocked user:', email)
            return false
          }

          if (!dbUser) {
            // Auto-create user from Google profile
            const nameParts = (user.name || '').split(' ')
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user.name || email.split('@')[0],
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                image: user.image || null,
                emailVerified: true, // Google emails are pre-verified
                emailVerifiedAt: new Date(),
                verified: true,
                verificationStatus: 'pending',
                verifiedAt: new Date(),
                password: '', // No password for OAuth users
              },
              select: { id: true, isBlocked: true, image: true },
            })
            console.log('[AUTH] Created new user from Google OAuth:', email)
          } else if (!dbUser.image && user.image) {
            // Update profile image from Google if user doesn't have one
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            })
          }

          // Store the DB user ID so the jwt callback can use it
          user.id = dbUser.id
          return true
        } catch (error) {
          console.error('[AUTH] Google OAuth error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }: any) {
      // Beim Login: Setze alle Felder aus dem User-Objekt
      if (user) {
        token.id = user.id
        token.image = user.image
        token.nickname = user.nickname
        token.isAdmin = user.isAdmin === true || false
        token.email = user.email

        // For OAuth users, fetch additional fields from DB
        if (account?.provider === 'google') {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { nickname: true, isAdmin: true, image: true },
            })
            if (dbUser) {
              token.nickname = dbUser.nickname
              token.isAdmin = dbUser.isAdmin === true
              token.image = dbUser.image || user.image
            }
          } catch {
            // Non-critical
          }
        }

        console.log('[AUTH] JWT callback - User logged in:', {
          id: user.id,
          email: user.email,
          isAdmin: token.isAdmin,
        })
      }

      // Token zurückgeben (keine DB-Abfrage bei jedem Request)
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        session.user.nickname = token.nickname as string | null
        session.user.isAdmin = (token.isAdmin as boolean) || false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
}
