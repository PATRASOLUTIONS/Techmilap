import mongoose, { Schema } from "mongoose"

// Define the FormSubmission schema
const FormSubmissionSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Not required for public submissions
    },
    userName: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    formType: {
      type: String,
      enum: ["attendee", "volunteer", "speaker"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Add indexes to improve query performance
FormSubmissionSchema.index({ eventId: 1 })
FormSubmissionSchema.index({ userId: 1 })
FormSubmissionSchema.index({ userEmail: 1 })
FormSubmissionSchema.index({ formType: 1 })
FormSubmissionSchema.index({ status: 1 }) // Add index for status field for better query performance

// Check if the model already exists to prevent OverwriteModelError
const FormSubmission = mongoose.models.FormSubmission || mongoose.model("FormSubmission", FormSubmissionSchema)

export default FormSubmission
