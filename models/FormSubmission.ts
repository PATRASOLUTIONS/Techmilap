import mongoose, { Schema, type Document } from "mongoose"

export interface IFormSubmission extends Document {
  eventId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  userEmail?: string
  userName?: string
  formType: string
  data: Record<string, any>
  status: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
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
      // Not required to allow submissions from non-registered users
    },
    userEmail: {
      type: String,
      index: true, // Add index for faster email-based lookups
    },
    userName: {
      type: String,
    },
    formType: {
      type: String,
      required: [true, "Form type is required"],
      enum: ["attendee", "volunteer", "speaker", "custom"],
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, "Form data is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Add compound index for userId, userEmail, and status for better query performance
FormSubmissionSchema.index({ userId: 1, userEmail: 1, status: 1 })

export default mongoose.models.FormSubmission || mongoose.model<IFormSubmission>("FormSubmission", FormSubmissionSchema)
