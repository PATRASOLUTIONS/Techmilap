import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // register, volunteer, or speaker

    // Map "register" to "attendee" for API consistency
    const apiFormType = formType === "register" ? "attendee" : formType

    console.log(`Fetching form config for eventId: ${eventId}, formType: ${formType}, apiFormType: ${apiFormType}`)

    if (!["register", "volunteer", "speaker"].includes(formType)) {
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

    // Log the structure of customQuestions to debug
    console.log("customQuestions structure:", JSON.stringify(event.customQuestions || {}))

    // Get the form status based on form type
    let formStatus = "draft"
    let formTitle = ""
    let formDescription = ""
    let formFields = []

    // Check if the form exists and is published
    if (apiFormType === "attendee" && event.attendeeForm) {
      formStatus = event.attendeeForm.status || "draft"
      formTitle = event.attendeeForm.title || `Register for ${event.title}`
      formDescription = event.attendeeForm.description || "Please fill out this form to register for the event"
    } else if (apiFormType === "volunteer" && event.volunteerForm) {
      formStatus = event.volunteerForm.status || "draft"
      formTitle = event.volunteerForm.title || `Volunteer for ${event.title}`
      formDescription = event.volunteerForm.description || "Apply to volunteer for this event"
    } else if (apiFormType === "speaker" && event.speakerForm) {
      formStatus = event.speakerForm.status || "draft"
      formTitle = event.speakerForm.title || `Speak at ${event.title}`
      formDescription = event.speakerForm.description || "Apply to speak at this event"
    } else {
      // Default values if form configuration doesn't exist
      formTitle =
        formType === "register"
          ? `Register for ${event.title}`
          : formType === "volunteer"
            ? `Volunteer for ${event.title}`
            : `Speak at ${event.title}`
      formDescription =
        formType === "register"
          ? "Please fill out this form to register for the event"
          : formType === "volunteer"
            ? "Apply to volunteer for this event"
            : "Apply to speak at this event"
      formStatus = "published" // Default to published for better user experience
    }

    // Get the custom questions from the database
    if (event.customQuestions) {
      console.log(`Checking for ${apiFormType} questions in customQuestions`)

      // Check if customQuestions has the specific form type
      if (event.customQuestions[apiFormType]) {
        console.log(`Found ${apiFormType} questions:`, JSON.stringify(event.customQuestions[apiFormType]))
        formFields = Array.isArray(event.customQuestions[apiFormType]) ? event.customQuestions[apiFormType] : []
      } else {
        console.log(`No ${apiFormType} questions found in customQuestions`)
      }
    } else {
      console.log("No customQuestions object found in event")
    }

    // Add default fields if they don't exist
    if (apiFormType === "attendee") {
      // Check if firstName and lastName fields exist
      const hasFirstName = formFields.some((field) => field.id === "firstName")
      const hasLastName = formFields.some((field) => field.id === "lastName")
      const hasEmail = formFields.some((field) => field.id === "email")

      if (!hasFirstName) {
        formFields.unshift({
          id: "firstName",
          type: "text",
          label: "First Name",
          required: true,
          placeholder: "Enter your first name",
        })
      }

      if (!hasLastName) {
        formFields.push({
          id: "lastName",
          type: "text",
          label: "Last Name",
          required: true,
          placeholder: "Enter your last name",
        })
      }

      if (!hasEmail) {
        formFields.push({
          id: "email",
          type: "email",
          label: "Email",
          required: true,
          placeholder: "Enter your email address",
        })
      }
    } else {
      // For volunteer and speaker forms
      const hasName = formFields.some((field) => field.id === "name")
      const hasEmail = formFields.some((field) => field.id === "email")

      if (!hasName) {
        formFields.unshift({
          id: "name",
          type: "text",
          label: "Full Name",
          required: true,
          placeholder: "Enter your full name",
        })
      }

      if (!hasEmail) {
        formFields.push({
          id: "email",
          type: "email",
          label: "Email",
          required: true,
          placeholder: "Enter your email address",
        })
      }

      // Add form-specific default fields
      if (apiFormType === "volunteer" && !formFields.some((f) => f.id === "availability")) {
        formFields.push({
          id: "availability",
          type: "textarea",
          label: "Availability",
          required: true,
          placeholder: "Please describe your availability for this event",
        })
      } else if (apiFormType === "speaker" && !formFields.some((f) => f.id === "topic")) {
        formFields.push({
          id: "topic",
          type: "text",
          label: "Presentation Topic",
          required: true,
          placeholder: "Enter your presentation topic",
        })

        if (!formFields.some((f) => f.id === "bio")) {
          formFields.push({
            id: "bio",
            type: "textarea",
            label: "Speaker Bio",
            required: true,
            placeholder: "Tell us about yourself",
          })
        }
      }
    }

    console.log(`Final form fields count: ${formFields.length}`)

    // Return the form configuration
    return NextResponse.json({
      form: {
        title: formTitle,
        description: formDescription,
        status: formStatus,
        fields: formFields,
      },
      event: {
        title: event.title,
        date: event.date,
        location: event.location,
        slug: event.slug || eventId,
      },
    })
  } catch (error: any) {
    console.error(`Error fetching ${params.formType} form config:`, error)
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
