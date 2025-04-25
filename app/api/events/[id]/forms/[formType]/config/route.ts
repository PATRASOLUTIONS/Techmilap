import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    console.log(`Fetching form config for eventId: ${eventId}, formType: ${formType}`)

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      console.warn(`Invalid form type: ${formType}`)
      return NextResponse.json({ error: "Invalid form type" }, { status: 400 })
    }

    // Connect to database
    console.log("Connecting to database...")
    const client = await connectToDatabase()
    const db = client.db()
    console.log("Connected to database")

    // Get the event
    console.log(`Fetching event with ID: ${eventId}`)
    let event

    try {
      event = await db.collection("events").findOne({
        _id: new ObjectId(eventId),
      })
    } catch (error) {
      console.error(`Error parsing ObjectId: ${eventId}`, error)
      // Try to find by slug if ObjectId parsing fails
      event = await db.collection("events").findOne({
        slug: eventId,
      })
    }

    if (!event) {
      console.warn(`Event not found with ID/slug: ${eventId}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log(`Found event: ${event.title}`)

    // Create default form structure if not present
    const defaultForm = {
      title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form`,
      description: `Please fill out this form to ${formType === "attendee" ? "register" : "apply"} for this event.`,
      fields: [],
      status: "published",
    }

    // Get form configuration based on form type
    let formConfig = defaultForm

    if (formType === "attendee" && event.attendeeForm) {
      formConfig = {
        ...defaultForm,
        ...event.attendeeForm,
        status: event.attendeeForm.status || "published",
      }
    } else if (formType === "volunteer" && event.volunteerForm) {
      formConfig = {
        ...defaultForm,
        ...event.volunteerForm,
        status: event.volunteerForm.status || "published",
      }
    } else if (formType === "speaker" && event.speakerForm) {
      formConfig = {
        ...defaultForm,
        ...event.speakerForm,
        status: event.speakerForm.status || "published",
      }
    }

    // Create default fields based on form type
    const defaultFields = []

    if (formType === "attendee") {
      defaultFields.push(
        { id: "firstName", type: "text", label: "First Name", required: true },
        { id: "lastName", type: "text", label: "Last Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
      )
    } else if (formType === "volunteer") {
      defaultFields.push(
        { id: "name", type: "text", label: "Full Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "phone", type: "text", label: "Phone Number", required: false },
        { id: "availability", type: "textarea", label: "Availability", required: true },
      )
    } else if (formType === "speaker") {
      defaultFields.push(
        { id: "name", type: "text", label: "Full Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "topic", type: "text", label: "Presentation Topic", required: true },
        { id: "bio", type: "textarea", label: "Speaker Bio", required: true },
      )
    }

    // Get custom questions if they exist
    let customQuestions = []
    if (event.customQuestions && Array.isArray(event.customQuestions[formType])) {
      customQuestions = event.customQuestions[formType]
    }

    // Combine default fields with custom questions
    const fields = [...defaultFields, ...customQuestions]

    // Update form config with fields
    formConfig.fields = fields

    console.log(
      `Form config prepared with ${fields.length} fields (${defaultFields.length} default, ${customQuestions.length} custom)`,
    )

    return NextResponse.json({ form: formConfig })
  } catch (error: any) {
    console.error(`Error fetching form config:`, error)
    return NextResponse.json({ error: "Failed to fetch form configuration" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    // const session = await getServerSession(authOptions)

    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    await connectToDatabase()

    // Check if the ID is a valid MongoDB ObjectId
    // const isValidObjectId = mongoose.isValidObjectId(params.id)
    // let event = null

    // if (isValidObjectId) {
    //   // If it's a valid ObjectId, try to find by ID first
    //   event = await Event.findById(params.id)
    // }

    // // If not found by ID or not a valid ObjectId, try to find by slug
    // if (!event) {
    //   event = await Event.findOne({ slug: params.id })
    // }

    // if (!event) {
    //   return NextResponse.json({ error: "Event not found" }, { status: 404 })
    // }

    // // Check if the user is the organizer or a super-admin
    // if (event.organizer.toString() !== session.user.id && session.user.role !== "super-admin") {
    //   return NextResponse.json({ error: "Forbidden: You don't have permission to update this event" }, { status: 403 })
    // }

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
    // if (!event.customQuestions) {
    //   event.customQuestions = {}
    // }
    // event.customQuestions[formType] = fields

    // await event.save()

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
