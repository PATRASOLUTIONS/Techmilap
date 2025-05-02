import { getServerSession as getNextAuthServerSession } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Define validation schema for credentials
const CredentialsSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

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
        // Validate credentials
        const result = CredentialsSchema.safeParse(credentials)
        if (!result.success) {
          throw new Error("Invalid credentials format")
        }

        const { email, password } = result.data

        try {
          const client = await clientPromise
          const db = client.db()
          const user = await db.collection("users").findOne({
            email: email.toLowerCase(),
          })

          if (!user) {
            console.log(`Login attempt failed: User not found for email ${email}`)
            return null
          }

          // Check if the user is verified
          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in")
          }

          const passwordMatch = await bcrypt.compare(password, user.password)

          if (!passwordMatch) {
            console.log(`Login attempt failed: Invalid password for email ${email}`)
            return null
          }

          // Log successful login
          console.log(`User logged in successfully: ${email}`)

          return {
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role || "user",
            image: user.profileImage || null,
          }
        } catch (error: any) {
          console.error("Authentication error:", error)
          throw new Error(error.message || "Authentication error")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
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
  // Add security headers
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
}

// Export the getServerSession function with our authOptions
export const getServerSession = () => getNextAuthServerSession(authOptions)

export default authOptions
