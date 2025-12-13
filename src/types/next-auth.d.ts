/* eslint-disable no-unused-vars */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      nickname?: string | null
      image?: string | null
      isAdmin?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    nickname?: string | null
    image?: string | null
    isAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
