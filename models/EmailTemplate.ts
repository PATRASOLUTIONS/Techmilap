import mongoose from "mongoose"

// Define the schema for email templates
const EmailTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    templateType: {
      type: String,
      enum: ["success", "rejection", "ticket", "certificate", "reminder", "custom"],
      required: true,
      index: true,
    },
    designTemplate: {
      type: String,
      enum: ["simple", "modern", "elegant", "colorful", "minimal", "corporate"],
      default: "modern",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    variables: {
      type: [String],
      default: [],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      // Not required as templates can be global for a user
      index: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Create compound indexes for common queries
EmailTemplateSchema.index({ userId: 1, templateType: 1 })
EmailTemplateSchema.index({ userId: 1, eventId: 1 })
EmailTemplateSchema.index({ userId: 1, templateType: 1, eventId: 1 })

// Add pre-save hook to ensure only one default template per type per user
EmailTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    // Find other default templates of the same type for this user
    const existingDefault = await this.constructor.findOne({
      userId: this.userId,
      templateType: this.templateType,
      isDefault: true,
      _id: { $ne: this._id }, // Exclude current document
      eventId: this.eventId || null, // Match on eventId if present
    })

    if (existingDefault) {
      // Update the existing default to non-default
      await this.constructor.updateOne({ _id: existingDefault._id }, { $set: { isDefault: false } })
    }
  }
  next()
})

const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", EmailTemplateSchema)

export default EmailTemplate
