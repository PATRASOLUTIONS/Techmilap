import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        await connectToDatabase()

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          throw new Error("Invalid email or password")
        }

        // Check if email is verified
        if (!user.isVerified) {
          throw new Error("Please verify your email before logging in")
        }

        const isPasswordValid = await user.comparePassword(credentials.password)

        if (!isPasswordValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          corporateEmail: user.corporateEmail,
          designation: user.designation,
          eventOrganizer: user.eventOrganizer,
          isMicrosoftMVP: user.isMicrosoftMVP,
          mvpId: user.mvpId,
          mvpProfileLink: user.mvpProfileLink,
          mvpCategory: user.mvpCategory,
          isMeetupGroupRunning: user.isMeetupGroupRunning,
          meetupEventName: user.meetupEventName,
          eventDetails: user.eventDetails,
          meetupPageDetails: user.meetupPageDetails,
          linkedinId: user.linkedinId,
          githubId: user.githubId,
          otherSocialMediaId: user.otherSocialMediaId,
          mobileNumber: user.mobileNumber,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.corporateEmail = user.corporateEmail
        token.designation = user.designation
        token.eventOrganizer = user.eventOrganizer
        token.isMicrosoftMVP = user.isMicrosoftMVP
        token.mvpId = user.mvpId
        token.mvpProfileLink = user.mvpProfileLink
        token.mvpCategory = user.mvpCategory
        token.isMeetupGroupRunning = user.isMeetupGroupRunning
        token.meetupEventName = user.meetupEventName
        token.eventDetails = user.eventDetails
        token.meetupPageDetails = user.meetupPageDetails
        token.linkedinId = user.linkedinId
        token.githubId = user.githubId
        token.otherSocialMediaId = user.otherSocialMediaId
        token.mobileNumber = user.mobileNumber
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.corporateEmail = token.corporateEmail as string
        session.user.designation = token.designation as string
        session.user.eventOrganizer = token.eventOrganizer as string
        session.user.isMicrosoftMVP = token.isMicrosoftMVP as boolean
        session.user.mvpId = token.mvpId as string
        session.user.mvpProfileLink = token.mvpProfileLink as string
        session.user.mvpCategory = token.mvpCategory as string
        session.user.isMeetupGroupRunning = token.isMeetupGroupRunning as boolean
        session.user.meetupEventName = token.meetupEventName as string
        session.user.eventDetails = token.eventDetails as string
        session.user.meetupPageDetails = token.meetupPageDetails as string
        session.user.linkedinId = token.linkedinId as string
        session.user.githubId = token.githubId as string
        session.user.otherSocialMediaId = token.otherSocialMediaId as string
        session.user.mobileNumber = token.mobileNumber as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
