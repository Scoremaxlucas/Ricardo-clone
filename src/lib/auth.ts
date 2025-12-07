import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key',
  adapter: undefined, // Disable adapter for now
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials')
            return null
          }

          // Normalize email (lowercase and trim)
          const normalizedEmail = credentials.email.toLowerCase().trim()

          console.log('[AUTH] Attempting login for:', normalizedEmail)
          console.log('[AUTH] Password length:', credentials.password.length)

          // WICHTIG: Stelle sicher, dass Prisma verbunden ist
          // Prüfe Datenbankverbindung zuerst
          try {
            await prisma.$connect()
          } catch (connectError: any) {
            console.error('[AUTH] Database connection error:', connectError)
            throw new Error('Database connection failed')
          }

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
            console.error('[AUTH] Database query error:', dbError)
            console.error('[AUTH] Database error details:', {
              message: dbError.message,
              code: dbError.code,
              name: dbError.name,
            })
            throw dbError
          }

          if (!user) {
            console.log('[AUTH] User not found:', normalizedEmail)
            // WICHTIG: Prüfe ob User mit anderer Groß-/Kleinschreibung existiert
            const allUsers = await prisma.user.findMany({
              select: { email: true },
              take: 10,
            })
            console.log('[AUTH] Sample users in database:', allUsers.map(u => u.email))
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
          const passwordIsHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')
          
          console.log('[AUTH] Password check:', {
            providedLength: credentials.password.length,
            storedLength: user.password.length,
            storedStartsWith: user.password.substring(0, 10),
            isHashed: passwordIsHashed,
          })

          try {
            if (passwordIsHashed) {
              // Passwort ist gehasht, verwende bcrypt
              isPasswordValid = await bcrypt.compare(credentials.password, user.password)
              console.log('[AUTH] Bcrypt password valid:', isPasswordValid)
            } else {
              // Passwort ist nicht gehasht, direkter Vergleich
              console.log('[AUTH] Password not hashed, trying direct comparison')
              isPasswordValid = credentials.password === user.password
              console.log('[AUTH] Direct comparison result:', isPasswordValid)
            }
          } catch (bcryptError: any) {
            console.error('[AUTH] Bcrypt comparison error:', bcryptError)
            // Fallback: Versuche direkten Vergleich wenn bcrypt fehlschlägt
            if (!passwordIsHashed) {
              console.log('[AUTH] Fallback: Trying direct password comparison')
              isPasswordValid = credentials.password === user.password
              console.log('[AUTH] Direct comparison result:', isPasswordValid)
            }
            if (!isPasswordValid) {
              console.log('[AUTH] Password validation failed after fallback')
              return null
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

          console.log('[AUTH] ✅ Login successful for:', normalizedEmail, 'isAdmin:', user.isAdmin)

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            nickname: user.nickname,
            image: user.image,
            isAdmin: user.isAdmin === true,
          }
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
