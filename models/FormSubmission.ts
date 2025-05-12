import mongoose, { Schema, type Document } from "mongoose"

export interface IFormSubmission extends Document {
  eventId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  userName?: string
  userEmail?: string
  formType: "attendee" | "volunteer" | "speaker"
  formData: Record<string, any>
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
  notes?: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  isCheckedIn: boolean
  checkedInAt?: Date
  lastCheckedInAt?: Date
  checkedInBy?: mongoose.Types.ObjectId
  checkInCount: number
  isWebCheckIn?: boolean
  webCheckInDate?: Date
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    formType: {
      type: String,
      enum: ["attendee", "volunteer", "speaker"],
      required: [true, "Form type is required"],
    },
    formData: {
      type: Schema.Types.Mixed,
      required: [true, "Form data is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    lastCheckedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    checkInCount: {
      type: Number,
      default: 0,
    },
    isWebCheckIn: {
      type: Boolean,
      default: false,
    },
    webCheckInDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.FormSubmission || mongoose.model<IFormSubmission>("FormSubmission", FormSubmissionSchema)
