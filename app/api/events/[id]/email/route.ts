import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Import the sendEmail function from the email-service
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to the database
    const { db } = await connectToDatabase()

    // Get the event
    let event
    try {
      event = await db.collection("events").findOne({
        _id: new ObjectId(params.id),
      })
    } catch (error) {
      // If not a valid ObjectId, try to find by slug
      event = await db.collection("events").findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is authorized to send emails for this event
    if (
      event.organizer.toString() !== session.user.id &&
      session.user.role !== "super-admin" &&
      !event.collaborators?.includes(session.user.id)
    ) {
      return NextResponse.json({ error: "You are not authorized to send emails for this event" }, { status: 403 })
    }

    // Get the email data from the request body
    const { to, subject, html, text } = await req.json()

    // Validate the email data
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and either html or text" },
        { status: 400 },
      )
    }

    // Send the email using the new API
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
    })

    if (result) {
      return NextResponse.json({ success: true, message: "Email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send email. Check server logs for details." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      {
        error: "An error occurred while sending the email",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
