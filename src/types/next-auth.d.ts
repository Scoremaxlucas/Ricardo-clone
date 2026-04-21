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
    isAdmin?: boolean
  }

  // next-auth v4 liefert getToken zur Laufzeit; die mitgelieferten Typen sind hier unvollständig.
  export function getToken(params: {
    req: import('next/server').NextRequest
    secret?: string
    raw?: false
  }): Promise<JWT | null>
}
