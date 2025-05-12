import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { handleFormSubmission } from "@/lib/form-submission"

export async function POST(request: Request, { params }: { params: { id: string; formType: string } }) {
  try {
    const eventId = params.id
    const formType = params.formType // attendee, volunteer, or speaker

    // Validate form type
    if (!["attendee", "volunteer", "speaker"].includes(formType)) {
      return NextResponse.json(
        { error: "Invalid form type" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Parse the request body
    let requestData
    try {
      requestData = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request body. Please provide valid JSON." },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    const { formData } = requestData

    if (!formData) {
      return NextResponse.json(
        { error: "Missing form data" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    // Get the user session if available
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError) {
      console.error("Error getting session:", sessionError)
      // Continue without session
    }

    // Get the user ID from the session if available
    const userId = session?.user?.id || null

    // Handle the form submission
    const result = await handleFormSubmission(eventId, formType, formData, userId)

    // Return the result
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error(`Error handling ${params.formType} form submission:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
