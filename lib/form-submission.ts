import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// This is a partial implementation focusing on the handleFormSubmission function
// to ensure it sets the status to "pending" for attendee registrations

export async function handleFormSubmission(
  eventIdOrSlug: string,
  formType: string,
  formData: any,
  userId: string | null,
) {
  try {
    const { db } = await connectToDatabase()

    // Find the event by ID or slug
    let event
    try {
      const objectId = new ObjectId(eventIdOrSlug)
      event = await db.collection("events").findOne({ _id: objectId })
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      event = await db.collection("events").findOne({ slug: eventIdOrSlug })
    }

    if (!event) {
      return { success: false, message: "Event not found" }
    }

    // Always set status to pending for all form types
    const status = "pending"

    // Create the submission document
    const submission = {
      eventId: event._id,
      userId: userId ? new ObjectId(userId) : null,
      userName: formData.firstName ? `${formData.firstName} ${formData.lastName || ""}`.trim() : formData.name,
      userEmail: formData.email,
      formType,
      status,
      data: formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert the submission
    const result = await db.collection("formsubmissions").insertOne(submission)

    // Return success response
    return {
      success: true,
      message: `${formType} submission received and pending approval`,
      submissionId: result.insertedId.toString(),
    }
  } catch (error) {
    console.error("Error handling form submission:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
