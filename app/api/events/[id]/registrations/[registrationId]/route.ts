import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId, registrationId } = params

    const { db } = await connectToDatabase()

    // Get the registration
    const registration = await db.collection("form_submissions").findOne({
      _id: new ObjectId(registrationId),
      eventId: eventId,
      formType: "attendee",
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Error fetching registration:", error)
    return NextResponse.json({ error: "Failed to fetch registration" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; registrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return
\
Let's update the attendees page to properly extract and display the form data:
