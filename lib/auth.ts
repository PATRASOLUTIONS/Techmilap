import { getServerSession as getNextAuthServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const client = await clientPromise
          const db = client.db()
          const user = await db.collection("users").findOne({
            email: credentials.email.toLowerCase(),
          })

          if (!user) {
            return null
          }

          // Check if the user is verified
          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in")
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
            image: user.image || null,
          }
        } catch (error: any) {
          throw new Error(error.message || "Authentication error")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

// Export the getServerSession function with our authOptions
export const getServerSession = () => getNextAuthServerSession(authOptions)

export default authOptions
