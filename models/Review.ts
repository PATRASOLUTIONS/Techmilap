import mongoose, { Schema, type Document } from "mongoose"

export interface IReview extends Document {
  eventId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  rating: number
  title: string
  comment: string
  reply?: {
    text: string
    createdAt: Date
  }
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    reply: {
      text: {
        type: String,
        trim: true,
        maxlength: [1000, "Reply cannot exceed 1000 characters"],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
)

// Create compound indexes for common queries
ReviewSchema.index({ eventId: 1, userId: 1 }, { unique: true })
ReviewSchema.index({ eventId: 1, status: 1 })
ReviewSchema.index({ userId: 1, status: 1 })

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)
