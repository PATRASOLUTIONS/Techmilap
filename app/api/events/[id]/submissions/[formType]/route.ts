import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { handleFormSubmission } from "@/lib/form-submission"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json({ success: false, error: "Invalid form type" }, { status: 400 })
    }

    // Get the request body
    const body = await request.json()
    const formData = body.formData

    if (!formData) {
      return NextResponse.json({ success: false, error: "No form data provided" }, { status: 400 })
    }

    // Get the user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Handle the form submission
    const result = await handleFormSubmission(eventId, formType, formData, userId)

    if (!result.success) {
      // Return a more specific error message
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Form submission failed",
          details: result.errors || {},
        },
        { status: 400 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error handling ${params.formType} form submission:`, error)

    // Return a user-friendly error message
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process your submission. Please try again.",
        message: errorMessage,
      },
      { status: 500 },
    )
  }
}
