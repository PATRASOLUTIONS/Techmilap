import mongoose from "mongoose"

const FormSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Changed from true to false to make it optional
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    formType: {
      type: String,
      enum: ["attendee", "volunteer", "speaker"],
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    // Add these fields to store user information from the form
    userName: {
      type: String,
      required: false,
    },
    userEmail: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

// Create compound indexes for common queries
FormSubmissionSchema.index({ eventId: 1, formType: 1, status: 1 }) // For finding submissions by event and type
FormSubmissionSchema.index({ userId: 1, status: 1 }) // For finding user's submissions by status

// Create the model - ensure it's only created once
const FormSubmission = mongoose.models.FormSubmission || mongoose.model("FormSubmission", FormSubmissionSchema)

export default FormSubmission
