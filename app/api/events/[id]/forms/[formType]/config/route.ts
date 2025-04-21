import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    console.log(`GET form config for event: ${params.id}, form type: ${params.formType}`)
    await connectToDatabase()

    // Check if we're requesting public access
    const isPublicRequest = req.headers.get("x-public-request") === "true"
    const session = isPublicRequest ? null : await getServerSession(authOptions)

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(params.id).lean()
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      console.log(`Event not found by ID or not a valid ObjectId, trying slug: ${params.id}`)
      event = await Event.findOne({ slug: params.id }).lean()
    }

    if (!event) {
      console.log(`Event not found for ID/slug: ${params.id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title} (${event._id})`)

    // For public requests, only return published events
    if (isPublicRequest && event.status !== "published" && event.status !== "active") {
      console.log(`Public request for non-published event: ${event._id}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // For authenticated requests, check permissions
    if (!isPublicRequest && session) {
      // Check if the user is the organizer or a super-admin
      if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
        console.log(`Permission denied for user ${session.user.id} on event ${event._id}`)
        return NextResponse.json(
          { error: "Forbidden: You don't have permission to access this event" },
          { status: 403 },
        )
      }
    }

    // Map form type to the corresponding field in the event document
    let formType = params.formType
    if (formType === "attendee") {
      formType = "attendee"
    } else if (formType === "volunteer") {
      formType = "volunteer"
    } else if (formType === "speaker") {
      formType = "speaker"
    } else {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Check if the form is published for public requests
    if (isPublicRequest) {
      const formStatus = event[`${formType}Form`]?.status
      if (formStatus !== "published") {
        console.log(`Form ${formType} is not published for event ${event._id}`)
        return NextResponse.json({ error: "Form not available" }, { status: 404 })
      }
    }

    // Get the custom questions for the specified form type
    const customQuestions = event.customQuestions?.[formType] || []

    // Create a form configuration object
    const form = {
      title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form`,
      description: `Please fill out this form to ${
        formType === "attendee" ? "register for" : `apply as a ${formType} for`
      } this event.`,
      fields: customQuestions,
      status: event[`${formType}Form`]?.status || "draft",
    }

    return NextResponse.json({ form })
  } catch (error: any) {
    console.error("Error fetching form config:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the form configuration" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; formType: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(params.id)
    let event = null

    if (isValidObjectId) {
      // If it's a valid ObjectId, try to find by ID first
      event = await Event.findById(params.id)
    }

    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!event) {
      event = await Event.findOne({ slug: params.id })
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the user is the organizer or a super-admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    }

    // Map form type to the corresponding field in the event document
    let formType = params.formType
    if (formType === "attendee") {
      formType = "attendee"
    } else if (formType === "volunteer") {
      formType = "volunteer"
    } else if (formType === "speaker") {
      formType = "speaker"
    } else {
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    const requestData = await req.json()
    const { fields } = requestData

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid fields data" }, { status: 400 })
    }

    // Update the custom questions for the specified form type
    if (!event.customQuestions) {
      event.customQuestions = {}
    }
    event.customQuestions[formType] = fields

    await event.save()

    return NextResponse.json({
      success: true,
      message: `${formType.charAt(0).toUpperCase() + formType.slice(1)} form updated successfully`,
    })
  } catch (error: any) {
    console.error("Error updating form config:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the form configuration" },
      { status: 500 },
    )
  }
}
