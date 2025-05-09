import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const { id, formType } = params

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    const { formData } = await request.json()

    if (!formData) {
      return NextResponse.json({ error: "Form data is required" }, { status: 400 })
    }

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the form is published
    let formStatus = "draft"
    if (formType === "attendee" && event.attendeeForm) {
      formStatus = event.attendeeForm.status || "draft"
    } else if (formType === "volunteer" && event.volunteerForm) {
      formStatus = event.volunteerForm.status || "draft"
    } else if (formType === "speaker" && event.speakerForm) {
      formStatus = event.speakerForm.status || "draft"
    }

    if (formStatus !== "published") {
      return NextResponse.json({ error: "This form is not currently accepting submissions" }, { status: 403 })
    }

    // Get user session if available
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Create the submission
    const submission = {
      eventId: id,
      formType,
      userId,
      data: formData,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save to database
    const result = await db.collection("formSubmissions").insertOne(submission)

    if (!result.acknowledged) {
      throw new Error("Failed to save submission")
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      submissionId: result.insertedId,
    })
  } catch (error) {
    console.error(`Error submitting ${params.formType} form:`, error)
    return NextResponse.json({ error: "Failed to submit form. Please try again." }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const { id, formType } = params

    // Ensure user is authenticated and authorized
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(id),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is the event organizer
    if (event.organizer.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get submissions for this event and form type
    const submissions = await db
      .collection("formSubmissions")
      .find({
        eventId: id,
        formType,
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      submissions,
    })
  } catch (error) {
    console.error(`Error fetching ${params.formType} submissions:`, error)
    return NextResponse.json({ error: "Failed to fetch submissions. Please try again." }, { status: 500 })
  }
}
