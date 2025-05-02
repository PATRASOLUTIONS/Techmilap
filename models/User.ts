import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"

export enum UserRole {
  USER = "user",
  EVENT_PLANNER = "event-planner",
  SUPER_ADMIN = "super-admin",
}

export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  isVerified: boolean
  verificationCode: string
  verificationCodeExpires: Date
  resetPasswordOTP?: string
  resetPasswordOTPExpiry?: Date
  resetPasswordToken?: string
  resetPasswordTokenExpiry?: Date
  corporateEmail?: string // New field
  designation?: string // New field
  eventOrganizer?: string // New field
  isMicrosoftMVP?: boolean // New field
  mvpId?: string // New field
  mvpProfileLink?: string // New field
  mvpCategory?: string // New field
  isMeetupGroupRunning?: boolean // New field
  meetupEventName?: string // New field
  eventDetails?: string // New field
  meetupPageDetails?: string // New field
  linkedinId?: string // New field
  githubId?: string // New field
  otherSocialMediaId?: string // New field
  mobileNumber?: string // New field
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  createdEvents: mongoose.Types.ObjectId[]
  registeredEvents: mongoose.Types.ObjectId[]
  profileImage?: string
  bio?: string
  company?: string
  jobTitle?: string
  website?: string
  social?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password should be at least 8 characters long"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    resetPasswordOTP: {
      type: String,
    },
    resetPasswordOTPExpiry: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpiry: {
      type: Date,
    },
    corporateEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    eventOrganizer: {
      type: String,
      trim: true,
    },
    isMicrosoftMVP: {
      type: Boolean,
      default: false,
    },
    mvpId: {
      type: String,
      trim: true,
    },
    mvpProfileLink: {
      type: String,
      trim: true,
    },
    mvpCategory: {
      type: String,
      trim: true,
    },
    isMeetupGroupRunning: {
      type: Boolean,
      default: false,
    },
    meetupEventName: {
      type: String,
      trim: true,
    },
    eventDetails: {
      type: String,
      trim: true,
    },
    meetupPageDetails: {
      type: String,
      trim: true,
    },
    linkedinId: {
      type: String,
      trim: true,
    },
    githubId: {
      type: String,
      trim: true,
    },
    otherSocialMediaId: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    createdEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    registeredEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    profileImage: { type: String },
    bio: { type: String },
    company: { type: String },
    jobTitle: { type: String },
    website: { type: String },
    social: {
      twitter: { type: String },
      linkedin: { type: String },
      github: { type: String },
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error("Error comparing passwords")
  }
}

// Create a text index for search functionality
UserSchema.index({ firstName: "text", lastName: "text", email: "text" })

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
