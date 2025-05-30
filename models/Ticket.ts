import mongoose, { Schema, type Document } from "mongoose"

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId
  event: mongoose.Types.ObjectId
  ticketType: string
  ticketNumber: string
  price: number
  status: string
  purchasedAt: Date
  name?: string
  email?: string
  isCheckedIn: boolean
  checkedInAt?: Date
  lastCheckedInAt?: Date
  checkedInBy?: mongoose.Types.ObjectId
  checkInCount: number
  isWebCheckIn?: boolean
  webCheckInDate?: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    ticketType: {
      type: String,
      required: [true, "Ticket type is required"],
      enum: ["Free", "Paid", "Donation"],
      default: "Free",
    },
    ticketNumber: {
      type: String,
      required: [true, "Ticket number is required"],
      unique: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refunded"],
      default: "confirmed",
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      index: true, // Add index for faster email-based lookups
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

// Add compound index for userId and email for better query performance
TicketSchema.index({ userId: 1, email: 1 })

export default mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema)
