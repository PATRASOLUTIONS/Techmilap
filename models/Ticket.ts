import mongoose, { Schema, type Document } from "mongoose"

export interface ITicket extends Document {
  name: string
  type: string
  description?: string
  pricingModel: "Free" | "Paid" | "Donation"
  price?: number
  quantity: number
  saleStartDate: Date
  saleEndDate: Date
  feeStructure?: "Organizer" | "Buyer" | "Split"
  event: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    name: {
      type: String,
      required: [true, "Ticket name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Ticket type is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pricingModel: {
      type: String,
      enum: ["Free", "Paid", "Donation"],
      required: [true, "Pricing model is required"],
      default: "Free",
    },
    price: {
      type: Number,
      min: 0,
    },
    quantity: {
      type: Number,
      required: [true, "Ticket quantity is required"],
      min: 1,
    },
    saleStartDate: {
      type: Date,
      required: [true, "Sale start date is required"],
    },
    saleEndDate: {
      type: Date,
      required: [true, "Sale end date is required"],
    },
    feeStructure: {
      type: String,
      enum: ["Organizer", "Buyer", "Split"],
      default: "Organizer",
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema)
