import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const formType = searchParams.get("type")

    const client = await connectToDatabase()
    const db = client.db()

    // Get the event
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // If a specific form type is requested, return just that one
    if (formType) {
      // Check for form in the volunteerForms collection
      if (formType === "volunteer") {
        const volunteerForm = await db.collection("volunteerForms").findOne({
          eventId: new ObjectId(eventId),
        })

        return NextResponse.json({
          status: volunteerForm ? volunteerForm.status || "draft" : "draft",
        })
      }

      // Check for form in the speakerForms collection
      if (formType === "speaker") {
        const speakerForm = await db.collection("speakerForms").findOne({
          eventId: new ObjectId(eventId),
        })

        return NextResponse.json({
          status: speakerForm ? speakerForm.status || "draft" : "draft",
        })
      }

      // Check for form in the attendeeForms collection
      if (formType === "attendee") {
        const attendeeForm = await db.collection("attendeeForms").findOne({
          eventId: new ObjectId(eventId),
        })

        return NextResponse.json({
          status: attendeeForm ? attendeeForm.status || "draft" : "draft",
        })
      }

      return NextResponse.json({ status: "draft" })
    }

    // Return the form status for each form type
    const volunteerForm = await db.collection("volunteerForms").findOne({
      eventId: new ObjectId(eventId),
    })

    const speakerForm = await db.collection("speakerForms").findOne({
      eventId: new ObjectId(eventId),
    })

    const attendeeForm = await db.collection("attendeeForms").findOne({
      eventId: new ObjectId(eventId),
    })

    return NextResponse.json({
      attendeeForm: attendeeForm || { status: "draft" },
      volunteerForm: volunteerForm || { status: "draft" },
      speakerForm: speakerForm || { status: "draft" },
    })
  } catch (error) {
    console.error("Error fetching form status:", error)
    return NextResponse.json({ error: "Failed to fetch form status. Please try again." }, { status: 500 })
  }
}
