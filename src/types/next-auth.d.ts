/* eslint-disable no-unused-vars */
declare module 'next-auth' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface JWT {
    id: string
  }
}
