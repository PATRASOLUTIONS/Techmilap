import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const client = await clientPromise
    const db = client.db()

    // Get the event to check ownership
    const event = await db.collection("events").findOne({
      _id: new ObjectId(eventId),
      "organizer.id": session.user.id,
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found or you don't have permission" }, { status: 404 })
    }

    // Get the volunteer form for this event
    const volunteerForm = await db.collection("volunteerForms").findOne({
      eventId: new ObjectId(eventId),
    })

    // If no form exists yet, return default fields
    if (!volunteerForm) {
      return NextResponse.json({
        form: {
          title: "Volunteer Application Form",
          description: "Please fill out this form to apply as a volunteer for this event.",
          fields: [
            {
              id: "name",
              type: "text",
              label: "Full Name",
              placeholder: "Enter your full name",
              required: true,
              order: 1,
            },
            {
              id: "email",
              type: "email",
              label: "Email Address",
              placeholder: "Enter your email address",
              required: true,
              order: 2,
            },
            {
              id: "phone",
              type: "tel",
              label: "Phone Number",
              placeholder: "Enter your phone number",
              required: true,
              order: 3,
            },
            {
              id: "role",
              type: "select",
              label: "Preferred Role",
              placeholder: "Select your preferred role",
              options: ["Event Setup", "Registration Desk", "Technical Support", "Food Service", "Cleanup Crew"],
              required: true,
              order: 4,
            },
            {
              id: "availability",
              type: "date",
              label: "Availability",
              placeholder: "Select dates you're available",
              required: true,
              order: 5,
            },
            {
              id: "experience",
              type: "textarea",
              label: "Previous Experience",
              placeholder: "Describe your previous volunteer experience",
              required: false,
              order: 6,
            },
            {
              id: "agreeToTerms",
              type: "checkbox",
              label: "I agree to the volunteer terms and conditions",
              required: true,
              order: 7,
            },
          ],
          status: "draft",
        },
      })
    }

    return NextResponse.json({ form: volunteerForm })
  } catch (error) {
    console.error("Error fetching volunteer form:", error)
    return NextResponse.json({ error: "Failed to fetch volunteer form" }, { status: 500 })
  }
}
