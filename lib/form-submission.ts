import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendFormSubmissionNotification } from "@/lib/email-service"

/**
 * Handles form submissions for events (attendee, volunteer, speaker)
 */
export async function handleFormSubmission(
  eventId: string,
  formType: string,
  formData: any,
  userId: string | null = null,
) {
  console.log(`Processing ${formType} submission for event ${eventId}`)

  // Validate input parameters
  if (!eventId) {
    throw new Error("Event ID is required")
  }

  if (!formType) {
    throw new Error("Form type is required")
  }

  if (!formData) {
    throw new Error("Form data is required")
  }

  console.log("Form data received:", JSON.stringify(formData, null, 2))

  // Validate form type
  const validFormTypes = ["attendee", "volunteer", "speaker"]
  if (!validFormTypes.includes(formType)) {
    console.error(`Invalid form type: ${formType}`)
    throw new Error(`Invalid form type: ${formType}`)
  }

  // Connect to MongoDB
  let db
  try {
    const connection = await connectToDatabase()
    db = connection.db
    console.log("Connected to database")
  } catch (dbConnectionError: any) {
    console.error("Database connection error:", dbConnectionError)
    throw new Error(`Failed to connect to database: ${dbConnectionError.message}`)
  }

  // Clean the form data to ensure no undefined values
  const cleanData = {}
  if (formData) {
    Object.keys(formData).forEach((key) => {
      cleanData[key] = formData[key] === undefined ? "" : formData[key]
    })
  }
  console.log("Cleaned form data:", JSON.stringify(cleanData, null, 2))

  // Convert string ID to ObjectId if possible
  let eventObjectId
  try {
    eventObjectId = new ObjectId(eventId)
    console.log("Converted event ID to ObjectId:", eventObjectId)
  } catch (error) {
    // If not a valid ObjectId, try to find by slug
    console.log("Event ID is not a valid ObjectId, trying to find by slug")
    const event = await db.collection("events").findOne({ slug: eventId })
    if (!event) {
      console.error("Event not found with slug:", eventId)
      throw new Error("Event not found")
    }
    eventObjectId = event._id
    console.log("Found event by slug, using ID:", eventObjectId)
  }

  // Find the event
  const event = await db.collection("events").findOne({ _id: eventObjectId })
  if (!event) {
    console.error("Event not found with ID:", eventObjectId)
    throw new Error("Event not found")
  }
  console.log("Found event:", event.title)

  // Create the submission document
  const submission = {
    eventId: eventObjectId,
    userId: userId ? new ObjectId(userId) : null,
    userName: formData.name || `${formData.firstName || ""} ${formData.lastName || ""}`.trim() || "Event Participant",
    userEmail: formData.email,
    formType: formType,
    status: formType === "attendee" ? "approved" : "pending", // Auto-approve registrations
    data: cleanData,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  console.log("Creating submission:", JSON.stringify(submission, null, 2))

  try {
    // Insert the submission
    const result = await db.collection("formsubmissions").insertOne(submission)
    console.log("Submission saved to database with ID:", result.insertedId)

    if (!result.acknowledged) {
      console.error("Database did not acknowledge the insertion")
      throw new Error("Failed to save submission to database")
    }

    // Get organizer information for email notification
    try {
      const organizer = await db.collection("users").findOne({ _id: new ObjectId(event.organizer) })

      if (organizer) {
        // Determine submitter name and email from the form data
        const submitterName =
          cleanData.name || `${cleanData.firstName || ""} ${cleanData.lastName || ""}`.trim() || "Event Participant"

        const submitterEmail = cleanData.email

        if (submitterEmail) {
          // Send email notifications
          await sendFormSubmissionNotification({
            eventName: event.title,
            formType: formType,
            submissionData: cleanData,
            recipientEmail: organizer.email,
            recipientName:
              organizer.name || `${organizer.firstName || ""} ${organizer.lastName || ""}`.trim() || "Event Organizer",
            eventId: eventId,
            submissionId: result.insertedId.toString(),
          })
          console.log("Email notification sent")
          await sendFormSubmissionNotification({
            eventName: event.title,
            formType: formType,
            submissionData: cleanData,
            recipientEmail: submitterEmail,
            recipientName: submitterName,
            eventId: eventId,
            submissionId: result.insertedId.toString(),
          })
          console.log("Email notification sent submnitter")
        } else {
          console.warn("No submitter email found, skipping notification")
        }
      } else {
        console.warn("No organizer found for event, skipping notification")
      }
    } catch (emailError) {
      console.error("Error sending email notification:", emailError)
      // Continue with the response even if email fails
    }

    return {
      success: true,
      message: "Form submission created successfully",
      submissionId: result.insertedId,
    }
  } catch (dbError: any) {
    console.error("Database error while saving submission:", dbError)
    throw new Error(`Database error: ${dbError.message}`)
  }
}
