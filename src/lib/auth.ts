import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key',
  adapter: undefined, // Disable adapter for now
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
  // WICHTIG: Trust host für Vercel/Production
  trustHost: true,
  providers: [
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
              console.log(`${logPrefix} Sample users in database:`, allUsers.map(u => u.email))
              console.log(`${logPrefix} Total users found:`, allUsers.length)
            } catch (error: any) {
              console.error(`${logPrefix} Error fetching sample users:`, error.message)
              // Ignore error - nur für Debugging
            }
            return null
          }

          console.log('[AUTH] User found:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password?.length || 0,
            isAdmin: user.isAdmin,
            isBlocked: user.isBlocked,
            emailVerified: user.emailVerified,
          })

          // Email verification check disabled - users can login immediately after registration
          const isAdmin = user.isAdmin === true

          // WICHTIG: Prüfe ob Benutzer blockiert ist
          // Nur explizit blockierte Benutzer werden abgelehnt
          // null, false, 0, oder undefined = nicht blockiert
          // Prüfe explizit auf true (Boolean)
          const isBlocked = user.isBlocked === true

          if (isBlocked) {
            console.log('[AUTH] User is blocked:', normalizedEmail, 'isBlocked value:', user.isBlocked)
            return null
          }

          console.log('[AUTH] User is NOT blocked:', normalizedEmail, 'isBlocked value:', user.isBlocked, 'type:', typeof user.isBlocked)

          if (!user.password) {
            console.log('[AUTH] User has no password set:', normalizedEmail)
            console.log('[AUTH] User data:', {
              id: user.id,
              email: user.email,
              hasPassword: !!user.password,
            })
            return null
          }

          // WICHTIG: Prüfe Passwort mit bcrypt
          // Fallback: Wenn bcrypt fehlschlägt, versuche direkten Vergleich (für alte Passwörter)
          let isPasswordValid = false
          const passwordIsHashed =
            user.password.startsWith('$2a$') ||
            user.password.startsWith('$2b$') ||
            user.password.startsWith('$2y$') ||
            user.password.startsWith('$2x$')

          console.log('[AUTH] Password check:', {
            providedLength: credentials.password.length,
            storedLength: user.password.length,
            storedStartsWith: user.password.substring(0, 10),
            isHashed: passwordIsHashed,
          })

          // WICHTIG: Versuche zuerst bcrypt, dann direkten Vergleich
          if (passwordIsHashed) {
            try {
              // Passwort ist gehasht, verwende bcrypt
              isPasswordValid = await bcrypt.compare(credentials.password, user.password)
              console.log('[AUTH] Bcrypt password valid:', isPasswordValid)
            } catch (bcryptError: any) {
              console.error('[AUTH] Bcrypt comparison error:', bcryptError)
              // Bei bcrypt-Fehler, versuche direkten Vergleich als Fallback
              console.log('[AUTH] Fallback: Trying direct password comparison after bcrypt error')
              isPasswordValid = credentials.password === user.password
              console.log('[AUTH] Direct comparison result:', isPasswordValid)
            }
          } else {
            // Passwort ist nicht gehasht, direkter Vergleich
            console.log('[AUTH] Password not hashed, trying direct comparison')
            isPasswordValid = credentials.password === user.password
            console.log('[AUTH] Direct comparison result:', isPasswordValid)

            // WICHTIG: Wenn direkter Vergleich fehlschlägt, versuche auch bcrypt
            // (für den Fall, dass das Passwort gehasht ist, aber nicht mit $2 beginnt)
            if (!isPasswordValid) {
              try {
                console.log('[AUTH] Direct comparison failed, trying bcrypt as fallback')
                isPasswordValid = await bcrypt.compare(credentials.password, user.password)
                console.log('[AUTH] Bcrypt fallback result:', isPasswordValid)
              } catch (bcryptError: any) {
                console.error('[AUTH] Bcrypt fallback error:', bcryptError)
                // Behalte isPasswordValid = false
              }
            }
          }

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', normalizedEmail)
            console.log('[AUTH] Password check details:', {
              providedLength: credentials.password.length,
              storedLength: user.password.length,
              storedStartsWith: user.password.substring(0, 10),
              isHashed: passwordIsHashed,
            })
            return null
          }

          console.log(`${logPrefix} ✅ Login successful for:`, normalizedEmail, 'isAdmin:', user.isAdmin)

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
    async jwt({ token, user }: any) {
      // Beim Login: Setze alle Felder aus dem User-Objekt
      if (user) {
        token.id = user.id
        token.image = user.image
        token.nickname = user.nickname
        token.isAdmin = user.isAdmin === true || false
        token.email = user.email
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
