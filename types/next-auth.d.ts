import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      corporateEmail?: string
      designation?: string
      eventOrganizer?: string
      isMicrosoftMVP?: boolean
      mvpId?: string
      mvpProfileLink?: string
      mvpCategory?: string
      isMeetupGroupRunning?: boolean
      meetupEventName?: string
      eventDetails?: string
      meetupPageDetails?: string
      linkedinId?: string
      githubId?: string
      otherSocialMediaId?: string
      mobileNumber?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    corporateEmail?: string
    designation?: string
    eventOrganizer?: string
    isMicrosoftMVP?: boolean
    mvpId?: string
    mvpProfileLink?: string
    mvpCategory?: string
    isMeetupGroupRunning?: boolean
    meetupEventName?: string
    eventDetails?: string
    meetupPageDetails?: string
    linkedinId?: string
    githubId?: string
    otherSocialMediaId?: string
    mobileNumber?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    corporateEmail?: string
    designation?: string
    eventOrganizer?: string
    isMicrosoftMVP?: boolean
    mvpId?: string
    mvpProfileLink?: string
    mvpCategory?: string
    isMeetupGroupRunning?: boolean
    meetupEventName?: string
    eventDetails?: string
    meetupPageDetails?: string
    linkedinId?: string
    githubId?: string
    otherSocialMediaId?: string
    mobileNumber?: string
  }
}
