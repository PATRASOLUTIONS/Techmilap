import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: { id: string; registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: eventId, registrationId } = params
    const { status } = await request.json()

    // Connect to the database
    await connectToDatabase()

    // Get the MongoDB connection
    const db = mongoose.connection

    // Get the registrations collection
    const registrationsCollection = db.collection("formsubmissions")

    // Update the registration status
    const result = await registrationsCollection.updateOne(
      { _id: new ObjectId(registrationId), eventId },
      { $set: { status } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: `Registration status updated to ${status}`,
    })
  } catch (error) {
    console.error("Error updating registration status:", error)
    return NextResponse.json({ error: "Failed to update registration status" }, { status: 500 })
  }
}
