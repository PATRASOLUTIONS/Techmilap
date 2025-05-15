import mongoose, { Schema, type Document } from "mongoose"

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId
  event: mongoose.Types.ObjectId
  ticketType: string
  ticketNumber: string
  customId?: string
  displayId?: string
  referenceId?: string
  formattedId?: string
  price: number
  status: string
  purchasedAt: Date
  name?: string
  email?: string
  attendeeName?: string
  attendeeEmail?: string
  isCheckedIn: boolean
  checkedInAt?: Date
  lastCheckedInAt?: Date
  checkedInBy?: mongoose.Types.ObjectId
  checkInCount: number
  isWebCheckIn?: boolean
  webCheckInDate?: Date
  metadata?: Record<string, any>
  notes?: string
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
      enum: ["attendee", "volunteer", "speaker", "vip", "standard", "early-bird"],
      default: "attendee",
    },
    ticketNumber: {
      type: String,
      required: [true, "Ticket number is required"],
      unique: true,
      index: true,
    },
    customId: {
      type: String,
      index: true,
    },
    displayId: {
      type: String,
      index: true,
    },
    referenceId: {
      type: String,
      index: true,
    },
    formattedId: {
      type: String,
      index: true,
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
      index: true,
    },
    attendeeName: {
      type: String,
      index: true,
    },
    attendeeEmail: {
      type: String,
      index: true,
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
    metadata: {
      type: Schema.Types.Mixed,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Add compound indices for better query performance
TicketSchema.index({ userId: 1, email: 1 })
TicketSchema.index({ eventId: 1, ticketNumber: 1 })
TicketSchema.index({ eventId: 1, customId: 1 })
TicketSchema.index({ eventId: 1, attendeeEmail: 1 })

export default mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema)
