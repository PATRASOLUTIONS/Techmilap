import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import mongoose from "mongoose"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const { registrationIds } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    // Connect to the database
    await connectToDatabase()

    // Get the MongoDB connection
    const db = mongoose.connection

    // Get the registrations collection
    const registrationsCollection = db.collection("formsubmissions")

    // Convert string IDs to ObjectIds
    const objectIds = registrationIds.map((id) => new ObjectId(id))

    // Update all registrations to approved status
    const result = await registrationsCollection.updateMany(
      {
        _id: { $in: objectIds },
        eventId: eventId,
      },
      { $set: { status: "approved" } },
    )

    // Return success
    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} registrations approved successfully`,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error bulk approving registrations:", error)
    return NextResponse.json({ error: "Failed to approve registrations" }, { status: 500 })
  }
}
