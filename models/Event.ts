import mongoose from "mongoose"

// Define the schema for custom questions with improved validation
const CustomQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^[a-zA-Z0-9_-]+$/.test(v),
        message: "Question ID must contain only alphanumeric characters, underscores, and hyphens",
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "textarea", "select", "radio", "checkbox", "date", "email", "phone", "number"],
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Label cannot exceed 200 characters"],
    },
    placeholder: {
      type: String,
      trim: true,
      maxlength: [200, "Placeholder cannot exceed 200 characters"],
    },
    required: { type: Boolean, default: false },
    options: [
      {
        id: {
          type: String,
          validate: {
            validator: (v: string) => /^[a-zA-Z0-9_-]+$/.test(v),
            message: "Option ID must contain only alphanumeric characters, underscores, and hyphens",
          },
        },
        value: {
          type: String,
          trim: true,
          maxlength: [100, "Option value cannot exceed 100 characters"],
        },
      },
    ],
  },
  { _id: false },
)

// Define the schema for registrations with improved validation
const RegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true, // Add index for better query performance
    },
    customResponses: {
      type: Map,
      of: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
      index: true, // Add index for better query performance
    },
  },
  { _id: false },
)

// Define the schema for embedded tickets
const EmbeddedTicketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    ticketType: {
      type: String,
      required: true,
      enum: ["Free", "Paid", "Donation"],
    },
    ticketNumber: { type: String, trim: true }, // As seen in your example data
    userId: { type: String, trim: true }, // As seen in your example data (can be empty string)
  },
  { _id: false }, // No separate _id for embedded tickets unless specifically needed
)

// Define the schema for events with improved validation and indexing
const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true, // Add index for better query performance
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [200, "Display name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[a-z0-9-]+$/.test(v),
        message: "Slug must contain only lowercase alphanumeric characters and hyphens",
      },
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      index: true, // Add index for better query performance
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: any, v: Date) {
          return !v || v >= this.date
        },
        message: "End date must be after or equal to start date",
      },
    },
    startTime: {
      type: String,
      validate: {
        validator: (v: string) => !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: "Start time must be in HH:MM format",
      },
    },
    endTime: {
      type: String,
      validate: {
        validator: function (this: any, v: string) {
          if (!v || !this.startTime) return true
          const [startHour, startMinute] = this.startTime.split(":").map(Number)
          const [endHour, endMinute] = v.split(":").map(Number)

          // Check if end time is after start time
          return endHour > startHour || (endHour === startHour && endMinute >= startMinute)
        },
        message: "End time must be after start time",
      },
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
      index: true, // Add index for better query performance
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: "Image URL must be a valid URL",
      },
    },
    capacity: {
      type: Number,
      required: true,
      default: 100,
      min: [1, "Capacity must be at least 1"],
      max: [10000, "Capacity cannot exceed 10,000"],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      trim: true,
      index: true, // Add index for better query performance
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed", "active"],
      default: "draft",
      index: true, // Add index for better query performance
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event organizer is required"],
      index: true, // Add index for better query performance
    },
    type: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      required: true
    },
    visibility: {
      type: String,
      enum: ["Public", "Private"],
      required: true
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
    tickets: [EmbeddedTicketSchema], // Required for editing a form
  },
  {
    timestamps: true,
    // Add optimistic concurrency control
    optimisticConcurrency: true,
    // Add schema options for better validation
    validateBeforeSave: true,
  },
)

// Add a text index for the slug field to improve search performance
EventSchema.index({ slug: 1 })

// Create a text index for search functionality
EventSchema.index(
  {
    title: "text",
    description: "text",
    location: "text",
    category: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      category: 5,
      tags: 3,
      location: 2,
      description: 1,
    },
    name: "event_text_index",
  },
)

// Add a case-insensitive index on slug to improve lookups
EventSchema.index(
  { slug: 1 },
  {
    collation: { locale: "en", strength: 2 }, // Case-insensitive
  },
)

// Add compound indexes for common queries
EventSchema.index({ status: 1, date: 1 }) // For finding upcoming published events
EventSchema.index({ organizer: 1, createdAt: -1 }) // For finding user's events

// Add virtual for checking if event is past
EventSchema.virtual("isPast").get(function (this: any) {
  return new Date() > this.date
})

// Add virtual for checking if event is upcoming
EventSchema.virtual("isUpcoming").get(function (this: any) {
  return new Date() <= this.date
})

// Add method to check if event is full
EventSchema.methods.isFull = function () {
  return this.attendees.length >= this.capacity
}

// Add method to get available spots
EventSchema.methods.getAvailableSpots = function () {
  return Math.max(0, this.capacity - this.attendees.length)
}

// Add pre-save hook to generate slug if not provided
EventSchema.pre("save", function (this: any, next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim()
  }
  next()
})

// Create the model - ensure it's only created once
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema)

export default Event
