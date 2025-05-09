import mongoose, { Schema, type Document } from "mongoose"
import bcrypt from "bcryptjs"
import validator from "validator"

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
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  failedLoginAttempts?: number
  accountLocked?: boolean
  accountLockedUntil?: Date
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
  emailDesignPreference?: string
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password should be at least 8 characters long"],
      // Don't return password in queries by default
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationCode: {
      type: String,
      select: false, // Don't return in queries by default
    },
    verificationCodeExpires: {
      type: Date,
      select: false, // Don't return in queries by default
    },
    resetPasswordOTP: {
      type: String,
      select: false, // Don't return in queries by default
    },
    resetPasswordOTPExpiry: {
      type: Date,
      select: false, // Don't return in queries by default
    },
    resetPasswordToken: {
      type: String,
      select: false, // Don't return in queries by default
    },
    resetPasswordTokenExpiry: {
      type: Date,
      select: false, // Don't return in queries by default
    },
    corporateEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (email: string) => !email || validator.isEmail(email),
        message: "Please provide a valid corporate email address",
      },
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    eventOrganizer: {
      type: String,
      trim: true,
      maxlength: [100, "Event organizer name cannot exceed 100 characters"],
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
      validate: {
        validator: (url: string) => !url || validator.isURL(url),
        message: "Please provide a valid URL for MVP profile",
      },
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
      validate: {
        validator: (url: string) => !url || validator.isURL(url),
        message: "Please provide a valid URL for meetup page",
      },
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
      validate: {
        validator: (phone: string) => !phone || validator.isMobilePhone(phone),
        message: "Please provide a valid mobile number",
      },
    },
    lastLogin: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLocked: {
      type: Boolean,
      default: false,
    },
    accountLockedUntil: {
      type: Date,
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
    profileImage: {
      type: String,
      validate: {
        validator: (url: string) => !url || validator.isURL(url),
        message: "Please provide a valid URL for profile image",
      },
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (url: string) => !url || validator.isURL(url),
        message: "Please provide a valid website URL",
      },
    },
    social: {
      twitter: {
        type: String,
        trim: true,
        validate: {
          validator: (url: string) => !url || validator.isURL(url),
          message: "Please provide a valid Twitter URL",
        },
      },
      linkedin: {
        type: String,
        trim: true,
        validate: {
          validator: (url: string) => !url || validator.isURL(url),
          message: "Please provide a valid LinkedIn URL",
        },
      },
      github: {
        type: String,
        trim: true,
        validate: {
          validator: (url: string) => !url || validator.isURL(url),
          message: "Please provide a valid GitHub URL",
        },
      },
    },
    emailDesignPreference: {
      type: String,
      enum: ["modern", "elegant", "colorful", "minimal", "corporate"],
      default: "modern",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Add virtual for full name
UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`
})

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    // Use a stronger salt factor (12 instead of 10)
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    // Need to select password explicitly since we've set select: false
    const user = await this.constructor.findById(this._id).select("+password")
    if (!user) return false

    return await bcrypt.compare(candidatePassword, user.password)
  } catch (error) {
    throw new Error("Error comparing passwords")
  }
}

// Method to handle failed login attempts
UserSchema.methods.registerFailedLogin = async function () {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1

  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true
    // Lock for 30 minutes
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000)
  }

  await this.save()
}

// Method to reset failed login attempts
UserSchema.methods.resetFailedLoginAttempts = async function () {
  this.failedLoginAttempts = 0
  this.accountLocked = false
  this.accountLockedUntil = undefined
  this.lastLogin = new Date()

  await this.save()
}

// Create a text index for search functionality
UserSchema.index({ firstName: "text", lastName: "text", email: "text" })

// Add compound indexes for common queries
UserSchema.index({ role: 1, isVerified: 1 })
UserSchema.index({ email: 1, isVerified: 1 })

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
export default User
