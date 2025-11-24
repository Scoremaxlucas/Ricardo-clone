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
        password: { label: 'Password', type: 'password' }
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

          // Stelle sicher, dass Prisma verbunden ist
          let user
          try {
            user = await prisma.user.findUnique({
              where: {
                email: normalizedEmail
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
              }
            })
          } catch (dbError: any) {
            console.error('[AUTH] Database query error:', dbError)
            console.error('[AUTH] Database error details:', {
              message: dbError.message,
              code: dbError.code,
            })
            return null
          }

          if (!user) {
            console.log('[AUTH] User not found:', normalizedEmail)
            return null
          }

          console.log('[AUTH] User found:', { 
            id: user.id, 
            email: user.email, 
            hasPassword: !!user.password, 
            isAdmin: user.isAdmin, 
            isBlocked: user.isBlocked,
            emailVerified: user.emailVerified
          })

          // Prüfe ob E-Mail bestätigt ist (RICARDO-STYLE: E-Mail-Bestätigung erforderlich)
          if (!user.emailVerified) {
            console.log('[AUTH] Email not verified:', normalizedEmail)
            throw new Error('EMAIL_NOT_VERIFIED')
          }

          // Prüfe ob Benutzer blockiert ist
          if (user.isBlocked === true || user.isBlocked === 1) {
            console.log('[AUTH] User is blocked:', normalizedEmail)
            return null
          }

          if (!user.password) {
            console.log('[AUTH] User has no password set:', normalizedEmail)
            return null
          }

          // Prüfe Passwort mit bcrypt
          let isPasswordValid = false
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password)
            console.log('[AUTH] Password valid:', isPasswordValid)
          } catch (bcryptError: any) {
            console.error('[AUTH] Bcrypt comparison error:', bcryptError)
            return null
          }

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for:', normalizedEmail)
            return null
          }

          console.log('[AUTH] Login successful for:', normalizedEmail, 'isAdmin:', user.isAdmin)

          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            nickname: user.nickname,
            image: user.image,
            isAdmin: user.isAdmin === true || user.isAdmin === 1,
          }
        } catch (error: any) {
          console.error('[AUTH] Error during authorization:', error)
          console.error('[AUTH] Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack?.substring(0, 500) // Limit stack trace
          })
          
          // Wenn es ein EMAIL_NOT_VERIFIED Error ist, werfe ihn weiter
          if (error.message === 'EMAIL_NOT_VERIFIED' || error.name === 'EmailNotVerified') {
            throw error
          }
          
          return null
        }
      }
    })
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
        token.isAdmin = user.isAdmin === true || user.isAdmin === 1 || false
        token.email = user.email
        console.log('[AUTH] JWT callback - User logged in:', { id: user.id, email: user.email, isAdmin: token.isAdmin })
      }
      
      // Token zurückgeben (keine DB-Abfrage bei jedem Request)
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        session.user.nickname = token.nickname as string | null
        session.user.isAdmin = token.isAdmin as boolean || false
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
}
