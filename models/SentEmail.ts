import mongoose from "mongoose"

const SentEmailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
    },
    designTemplate: {
      type: String,
      enum: ["simple", "modern", "elegant", "colorful", "minimal", "corporate"],
    },
    emailType: {
      type: String,
      enum: ["success", "rejection", "ticket", "certificate", "reminder", "custom"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
      index: true,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Create compound indexes for common queries
SentEmailSchema.index({ userId: 1, eventId: 1 })
SentEmailSchema.index({ eventId: 1, emailType: 1 })
SentEmailSchema.index({ createdAt: 1 }) // For date-based queries

const SentEmail = mongoose.models.SentEmail || mongoose.model("SentEmail", SentEmailSchema)

export default SentEmail
