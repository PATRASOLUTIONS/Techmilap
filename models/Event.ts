import mongoose from "mongoose"

// Define the schema for custom questions
const CustomQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    options: [
      {
        id: { type: String },
        value: { type: String },
      },
    ],
  },
  { _id: false },
)

// Define the schema for registrations
const RegistrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registeredAt: { type: Date, default: Date.now },
    customResponses: { type: Map, of: String },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "confirmed" },
  },
  { _id: false },
)

// Define the schema for events
const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    displayName: { type: String },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    startTime: { type: String },
    endTime: { type: String },
    location: { type: String, required: true },
    image: { type: String },
    capacity: { type: Number, required: true, default: 100 },
    price: { type: Number, default: 0 },
    category: { type: String, required: true },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed", "active"],
      default: "draft",
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    speakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    customQuestions: {
      attendee: [mongoose.Schema.Types.Mixed],
      volunteer: [mongoose.Schema.Types.Mixed],
      speaker: [mongoose.Schema.Types.Mixed],
    },
    attendeeForm: {
      status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
      },
    },
    volunteerForm: {
      status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
      },
    },
    speakerForm: {
      status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
      },
    },
    registrations: [RegistrationSchema],
  },
  { timestamps: true },
)

// Add a text index for the slug field to improve search performance
EventSchema.index({ slug: 1 })

// Create a text index for search functionality
EventSchema.index({ title: "text", description: "text", location: "text" })

// Create the model
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema)

export default Event
