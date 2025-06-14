import { getServerSession as getNextAuthServerSession } from "next-auth/next"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { client, connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcryptjs"
import User from "@/models/User"
import GitHubProvider, { GithubProfile } from "next-auth/providers/github"
import {MongoDBAdapter} from "@auth/mongodb-adapter"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(client),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password")
        }

        try {
          await connectToDatabase()

          const user = await User.findOne({ email: credentials.email.toLowerCase() }).select("+password")

          // Generic error for security - don't reveal if email exists or password is wrong
          if (!user) {
            console.log(`Login attempt failed: User not found for email ${credentials.email}`)
            throw new Error("Invalid credentials")
          }

          // Check if the user's email is verified
          if (user.isVerified === false) {
            throw new Error("Please verify your email before logging in")
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log(`Login attempt failed: Invalid password for email ${credentials.email}`)
            throw new Error("Invalid credentials")
          }

          return {
            id: user._id.toString(),
            name: user.firstName ? `${user.firstName} ${user.lastName}` : user.name || user.email,
            email: user.email,
            role: user.role || "user",
            image: user.profileImage || null,
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
        } catch (error: any) {
          console.error("Authentication error:", error)
          throw new Error(error.message || "Authentication failed")
        }
      },
    }),
    GitHubProvider<GithubProfile>({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      // async profile(profile: GithubProfile) {
      //     return {
      //       name: profile.name,
      //       email: profile.email,
      //       picture: profile.avatar_url,
      //       sub: "",
      //       id: profile.id,
      //       role: "user",
      //       corporateEmail: "",
      //       designation: "",
      //       eventOrganizer: "",
      //       isMicrosoftMVP: false,
      //       mvpId: "",
      //       mvpProfileLink: "",
      //       mvpCategory: "",
      //       isMeetupGroupRunning: false,
      //       meetupEventName: "",
      //       eventDetails: "",
      //       meetupPageDetails: "",
      //       linkedinId: "",
      //       githubId: "",
      //       otherSocialMediaId: "",
      //       mobileNumber:  "",
      //       iat: 1749901121,
      //       exp: 1752493121,
      //       jti: '3723e075-df0e-4e8a-b1e0-8b6bdddfbd21'
      //     }
      // },
async profile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    image: profile.avatar_url,
    role: 'user'
  };
}

    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if(account?.provider === "github") {
        await connectToDatabase()

        const existingUser = await User.findOne({email: user.email})

        if(!existingUser) {
          return null
        }

        token.id = existingUser.id
        token.role = existingUser.role
        token.corporateEmail = existingUser.corporateEmail
        token.designation = existingUser.designation
        token.eventOrganizer = existingUser.eventOrganizer
        token.isMicrosoftMVP = existingUser.isMicrosoftMVP
        token.mvpId = existingUser.mvpId
        token.mvpProfileLink = existingUser.mvpProfileLink
        token.mvpCategory = existingUser.mvpCategory
        token.eventDetails = existingUser.eventDetails 
        token.meetupEventName = existingUser.meetupEventName 
        token.linkedinId = existingUser.linkedinId 
        token.githubId = existingUser.githubId 
        token.otherSocialMediaId = existingUser.otherSocialMediaId 
        token.mobileNumber = existingUser.mobileNumber 
      }
      else 
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
        // Ensure role is always set, defaulting to "user" if not present
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "user"

        // Log the role being set in the session for debugging
        console.log(`Setting session role to: ${session.user.role}`)

        // Add other user properties
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

    async signIn({user, account, profile}) {
      if(account?.provider === "github") {
        await connectToDatabase()

        const existingUser = await User.findOne({email: user.email})

        if(!existingUser) {
          return false
        }

        user.id = existingUser.id
        user.role = existingUser.role
        user.corporateEmail = existingUser.corporateEmail
        user.designation = existingUser.designation
        user.eventOrganizer = existingUser.eventOrganizer
        user.isMicrosoftMVP = existingUser.isMicrosoftMVP
        user.mvpId = existingUser.mvpId
        user.mvpProfileLink = existingUser.mvpProfileLink
        user.mvpCategory = existingUser.mvpCategory
        user.eventDetails = existingUser.eventDetails 
        user.meetupEventName = existingUser.meetupEventName 
        user.linkedinId = existingUser.linkedinId 
        user.githubId = existingUser.githubId 
        user.otherSocialMediaId = existingUser.otherSocialMediaId 
        user.mobileNumber = existingUser.mobileNumber 
      }
      
      return true
    },
    
  },
  pages: {
    signIn: "/login",
    // Remove the error page to prevent redirects to error pages
    // error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

// Add the missing export
export const getServerSession = () => getNextAuthServerSession(authOptions)
