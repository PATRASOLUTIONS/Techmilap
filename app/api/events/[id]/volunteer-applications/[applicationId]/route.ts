import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string; applicationId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const event = await Event.findById(params.id).lean()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to access this event" }, { status: 403 })
    }

    // Find the specific application
    const application = event.volunteerApplications?.find((app) => app._id.toString() === params.applicationId)

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (error: any) {
    console.error("Error fetching volunteer application:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the volunteer application" },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; applicationId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await req.json()

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectToDatabase()

    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    // Find and update the application
    const applicationIndex = event.volunteerApplications?.findIndex(
      (app) => app._id.toString() === params.applicationId,
    )

    if (applicationIndex === -1 || applicationIndex === undefined) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Update the status
    event.volunteerApplications[applicationIndex].status = status

    await event.save()

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
    })
  } catch (error: any) {
    console.error("Error updating volunteer application:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the volunteer application" },
      { status: 500 },
    )
  }
}
