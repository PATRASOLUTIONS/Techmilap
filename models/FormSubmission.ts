import mongoose from "mongoose"

const FormSubmissionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    formType: {
      type: String,
      enum: ["attendee", "volunteer", "speaker"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    ticketNumber: {
      type: String,
      trim: true,
      index: true,
    },
    purchasedAt: {
      type: Date,
    },
    checkInStatus: {
      type: String,
      enum: ["not_checked_in", "checked_in"],
      default: "not_checked_in",
    },
    checkInTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Create compound indexes for common queries
FormSubmissionSchema.index({ eventId: 1, formType: 1 })
FormSubmissionSchema.index({ eventId: 1, status: 1 })
FormSubmissionSchema.index({ userId: 1, eventId: 1 })

const FormSubmission = mongoose.models.FormSubmission || mongoose.model("FormSubmission", FormSubmissionSchema)

export default FormSubmission
