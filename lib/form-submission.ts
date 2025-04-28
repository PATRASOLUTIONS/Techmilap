import mongoose from "mongoose"
import { connectToDatabase } from "@/lib/mongodb"
import { sendFormSubmissionNotification } from "@/lib/email-service"

// Import models
const Event = mongoose.models.Event || mongoose.model("Event", require("@/models/Event").default.schema)
const User = mongoose.models.User || mongoose.model("User", require("@/models/User").default.schema)
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model(
    "FormSubmission",
    new mongoose.Schema({
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      userEmail: String,
      formType: { type: String, required: true, enum: ["attendee", "volunteer", "speaker"] },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }),
  )

export async function handleFormSubmission(
  eventIdOrSlug: string,
  formType: "attendee" | "volunteer" | "speaker",
  formData: any,
  userId?: string | null,
) {
  try {
    console.log(`Handling ${formType} form submission for event ${eventIdOrSlug}`)

    await connectToDatabase()

    // Find the event by ID or slug
    let event
    if (mongoose.isValidObjectId(eventIdOrSlug)) {
      event = await Event.findById(eventIdOrSlug)
    }

    if (!event) {
      event = await Event.findOne({ slug: eventIdOrSlug })
    }

    if (!event) {
      console.error("Event not found:", eventIdOrSlug)
      return { success: false, message: "Event not found" }
    }

    // Check if the form is published
    let formConfig
    if (formType === "attendee") {
      formConfig = event.attendeeForm
    } else if (formType === "volunteer") {
      formConfig = event.volunteerForm
    } else if (formType === "speaker") {
      formConfig = event.speakerForm
    }

    if (!formConfig || formConfig.formSettings?.status !== "published") {
      console.error(`${formType} form is not published for event:`, event._id)
      return { success: false, message: `${formType} form is not available` }
    }

    // Get user details if userId is provided
    let user
    if (userId) {
      user = await User.findById(userId)
      if (!user) {
        console.error("User not found:", userId)
        return { success: false, message: "User not found" }
      }
    }

    // Create a name field from firstName and lastName if they exist
    let name = formData.name
    if (!name && formData.firstName && formData.lastName) {
      name = `${formData.firstName} ${formData.lastName}`.trim()
    }

    // Create the form submission
    const submission = new FormSubmission({
      eventId: event._id,
      formType,
      status: "pending", // Always set to pending initially
      userId: user?._id,
      userName: name || user?.firstName ? `${user.firstName} ${user.lastName || ""}` : undefined,
      userEmail: formData.email || user?.email,
      data: {
        ...formData,
        name: name || undefined,
      },
    })

    await submission.save()
    console.log(`${formType} form submission saved with ID:`, submission._id)

    // If it's an attendee submission, also update the event registrations
    if (formType === "attendee") {
      if (!event.registrations) {
        event.registrations = []
      }

      event.registrations.push({
        userId: user?._id,
        name: name || (user ? `${user.firstName} ${user.lastName || ""}` : undefined),
        email: formData.email || user?.email,
        status: "pending", // Set to pending initially
        registeredAt: new Date(),
        formSubmissionId: submission._id,
      })

      await event.save()
      console.log("Event updated with new registration")
    }

    // Send notification to the event organizer
    try {
      const organizer = await User.findById(event.organizer)
      console.log("Found organizer:", organizer ? organizer.email : "Not found")

      if (organizer && organizer.email) {
        console.log("Sending notification to organizer:", organizer.email)

        const notificationSent = await sendFormSubmissionNotification({
          eventName: event.title,
          formType,
          submissionData: formData,
          recipientEmail: organizer.email,
          recipientName: organizer.firstName,
          eventId: event._id.toString(),
          submissionId: submission._id.toString(),
        })

        console.log("Notification sent to organizer:", notificationSent)
      } else {
        console.error("Organizer not found or has no email:", event.organizer)
      }
    } catch (notificationError) {
      console.error("Error sending notification to organizer:", notificationError)
      // Don't fail the submission if notification fails
    }

    return {
      success: true,
      message: `${formType} submission successful and pending approval`,
      submissionId: submission._id.toString(),
    }
  } catch (error: any) {
    console.error(`Error handling ${formType} form submission:`, error)
    return {
      success: false,
      message: error.message || `An error occurred while submitting the ${formType} form`,
    }
  }
}
