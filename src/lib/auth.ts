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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || '')

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          nickname: user.nickname,
          image: user.image,
          isAdmin: user.isAdmin || false,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.image = user.image
        token.nickname = user.nickname
        token.isAdmin = user.isAdmin || false
        token.email = user.email // E-Mail für Middleware-Prüfung
      }
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
