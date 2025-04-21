import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

// Default form fields that should always be present
const DEFAULT_FORM_FIELDS = [
  {
    id: "name",
    type: "text",
    label: "Full Name",
    required: true,
    placeholder: "Enter your full name",
    isDefault: true,
  },
  {
    id: "email",
    type: "email",
    label: "Email Address",
    required: true,
    placeholder: "Enter your email address",
    isDefault: true,
  },
  {
    id: "phone",
    type: "text",
    label: "Phone Number",
    required: false,
    placeholder: "Enter your phone number",
    isDefault: true,
  },
  {
    id: "role",
    type: "select",
    label: "Preferred Role",
    required: true,
    placeholder: "Select your preferred role",
    options: ["Registration Desk", "Technical Support", "Speaker Assistant", "General Helper"],
    isDefault: true,
  },
  {
    id: "availability",
    type: "calendar",
    label: "Availability",
    required: true,
    placeholder: "Select dates you're available",
    isDefault: true,
  },
  {
    id: "experience",
    type: "textarea",
    label: "Relevant Experience",
    required: false,
    placeholder: "Tell us about any relevant experience you have",
    isDefault: true,
  },
  {
    id: "agreeToTerms",
    type: "checkbox",
    label: "Terms and Conditions",
    required: true,
    placeholder: "I agree to the volunteer terms and conditions",
    isDefault: true,
  },
]

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()

    const event = await Event.findById(params.id).lean()

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if the event is published
    if (event.status !== "published") {
      return NextResponse.json({ error: "Event is not published" }, { status: 404 })
    }

    // Check if the volunteer form exists and is published
    if (
      !event.volunteerForm ||
      !event.volunteerForm.formSettings ||
      event.volunteerForm.formSettings.status !== "published"
    ) {
      return NextResponse.json({ error: "Volunteer form is not available" }, { status: 404 })
    }

    // Ensure all default fields are present
    let formFields = event.volunteerForm.formFields || []

    // Check if all default fields are present
    const existingFieldIds = formFields.map((field) => field.id)
    const missingDefaultFields = DEFAULT_FORM_FIELDS.filter(
      (defaultField) => !existingFieldIds.includes(defaultField.id),
    )

    // Add any missing default fields
    if (missingDefaultFields.length > 0) {
      formFields = [...formFields, ...missingDefaultFields]
    }

    return NextResponse.json({
      formFields: formFields,
      formSettings: event.volunteerForm.formSettings || {},
    })
  } catch (error: any) {
    console.error("Error fetching volunteer form:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the volunteer form" },
      { status: 500 },
    )
  }
}
