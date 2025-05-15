import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  console.log(`POST request for form submission: ${params.formType}, event ID: ${params.id}`)

  try {
    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the request body
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body).substring(0, 200) + "...")

    // Validate form type
    const formType = params.formType
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Find the event by ID or slug
    const idOrSlug = params.id
    let event

    try {
      // Try to find by ObjectId first
      if (ObjectId.isValid(idOrSlug)) {
        event = await db.collection("events").findOne({ _id: new ObjectId(idOrSlug) })
      }

      // If not found, try by slug
      if (!event) {
        event = await db.collection("events").findOne({ slug: idOrSlug })
      }
    } catch (error) {
      console.error("Error finding event:", error)
      return NextResponse.json({ error: "Failed to find event" }, { status: 500 })
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${idOrSlug}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // Check if the form is published
    const formKey = `${formType}Form`
    const formStatus = event[formKey]?.status || "draft"

    if (formStatus !== "published") {
      console.log(`Form ${formType} is not published for event: ${event._id}`)
      return NextResponse.json({ error: "Form is not available for submissions" }, { status: 403 })
    }

    // Get the form data from the request body
    const formData = body.formData

    if (!formData) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Get the user session (if authenticated)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Extract name and email from form data
    let name = formData.name || formData.fullName || ""
    if (!name && formData.firstName) {
      name = formData.firstName + (formData.lastName ? ` ${formData.lastName}` : "")
    }

    const email = formData.email || formData.userEmail || formData.corporateEmail || ""

    // Create a new form submission
    const submission = {
      eventId: event._id,
      formType,
      data: formData,
      status: "pending", // Default status is pending
      userId: userId ? new ObjectId(userId) : null, // Link to user if authenticated
      userName: name,
      userEmail: email,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Insert the submission directly into the database
    try {
      const result = await db.collection("formsubmissions").insertOne(submission)
      console.log(`Form submission saved with ID: ${result.insertedId}`)

      // Send confirmation email (implement this separately)
      // await sendConfirmationEmail(event, formType, name, email)

      return NextResponse.json({
        success: true,
        message: "Your submission has been received successfully!",
        submissionId: result.insertedId.toString(),
      })
    } catch (dbError) {
      console.error("Database error saving submission:", dbError)
      return NextResponse.json({ error: "Failed to save your submission" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing form submission:", error)
    return NextResponse.json({ error: "An error occurred while processing your submission" }, { status: 500 })
  }
}
