import { getServerSession as getNextAuthServerSession } from "next-auth/next"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcryptjs"
import User from "@/models/User"
import GitHubProvider, { GithubProfile } from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
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
            mvpProfileLink: user.mvpUrl,
            mvpCategory: user.mvpCategory,
            isMeetupGroupRunning: user.isMeetupGroupRunning,
            meetupEventName: user.meetupEventName,
            eventDetails: user.eventDetails,
            meetupPageDetails: user.meetupPageDetails,
            linkedin: user.social?.linkedin,
            github: user.social?.github,
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
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
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
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() });

          console.log("OAuth User from provider:", user);
          console.log("OAuth Account from provider:", account);
          console.log("OAuth Profile from provider:", profile);
          console.log("Existing DB user:", dbUser);

          if (!dbUser) {
            // New user
            console.log(`OAuth: Creating new user for email ${user.email} from provider ${account.provider}`);
            
            let firstName = '';
            let lastName = '';
            let emailFromProfile = user.email?.toLowerCase(); // Default to user.email

            if (account.provider === "google" && profile) {
                // Define or import GoogleProfile type if you have one, otherwise cast
                const googleProfile = profile as { given_name?: string, family_name?: string, name?: string, email?: string };
                firstName = googleProfile.given_name || '';
                lastName = googleProfile.family_name || '';
                if (!firstName && googleProfile.name) { // Fallback to splitting name
                    const nameParts = googleProfile.name.split(' ');
                    firstName = nameParts[0] || '';
                    lastName = nameParts.slice(1).join(' ') || '';
                }
                if (googleProfile.email) emailFromProfile = googleProfile.email.toLowerCase();
            } else if (account.provider === "github" && profile) {
                const githubProfile = profile as GithubProfile; // Already imported
                if (githubProfile.name) {
                    const nameParts = githubProfile.name.split(' ');
                    firstName = nameParts[0] || '';
                    lastName = nameParts.slice(1).join(' ') || '';
                }
                // GitHub email might be null if private, user.email from NextAuth should have it
                if (githubProfile.email) emailFromProfile = githubProfile.email.toLowerCase();
            }

            if (!emailFromProfile) {
              console.error("OAuth: Email is null, cannot create user.");
              return false; // Or redirect to an error page
            }

            dbUser = await User.create({
              email: emailFromProfile,
              firstName: firstName,
              lastName: lastName,
              name: user.name || `${firstName} ${lastName}`.trim(), // Fallback or primary name
              profileImage: user.image || null,
              isVerified: true, // OAuth users are typically considered verified
              role: "user", // Explicitly set default role
              userType: "attendee", // Explicitly set default userType
              // Password will be unset due to schema `required: false`
            });

            if (!dbUser) {
                console.error("OAuth: Failed to create user in database for email:", emailFromProfile);
                return false; // Or redirect to an error page
            }
            console.log(`OAuth: New user created with ID ${dbUser._id}`);
          } else {
            console.log(`OAuth: Existing user found with ID ${dbUser._id} for email ${dbUser.email}`);
            // Optionally update existing user's profile image or name if changed from provider
            let needsUpdate = false;
            if (user.image && dbUser.profileImage !== user.image) {
                dbUser.profileImage = user.image;
                needsUpdate = true;
            }
            // Add other potential updates here if necessary
            if (needsUpdate) {
                await dbUser.save();
                console.log(`OAuth: User profile updated for ${dbUser.email}`);
            }
          
          }
          // Populate the NextAuth user object (which is passed to JWT callback)
          // with details from our database user (dbUser)
          user.id = dbUser._id.toString();
          user.role = dbUser.role || UserRole.USER; // Ensure role is always set
          user.name = dbUser.firstName ? `${dbUser.firstName} ${dbUser.lastName}`.trim() : dbUser.name || dbUser.email;
          user.email = dbUser.email; // Use email from DB for consistency
          user.image = dbUser.profileImage;
          // Add other custom fields needed for the token/session by casting `user`
          // (or use type augmentation for `next-auth` User type)
          (user as any).corporateEmail = dbUser.corporateEmail;
          (user as any).designation = dbUser.designation;
          // ... (add all other custom fields from dbUser to user object as needed for token) ...
          (user as any).mobileNumber = dbUser.mobileNumber;

          return true; // Sign-in successful

        } catch (error) {
          console.error("OAuth signIn Error:", error);
          return false; // Deny sign-in on error
        }
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
