import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { handleFormSubmission } from "@/lib/form-submission"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  console.log(`Received public registration for event ${params.id}`)

  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase()
    console.log("Connected to database")

    // Get the request body with careful error handling
    let body
    try {
      // Read the request body once and store it
      const rawText = await req.text()
      console.log("Raw request body:", rawText)

      // Try to parse as JSON
      try {
        body = JSON.parse(rawText)
        console.log("Parsed request body:", body)
      } catch (jsonError: any) {
        console.error("JSON parse error:", jsonError)
        return NextResponse.json(
          {
            error: "Invalid JSON in request body",
            details: jsonError.message,
            rawBody: rawText.substring(0, 200) + (rawText.length > 200 ? "..." : ""),
          },
          { status: 400 },
        )
      }
    } catch (parseError: any) {
      console.error("Error reading request body:", parseError)
      return NextResponse.json({ error: "Could not read request body" }, { status: 400 })
    }

    const { firstName, lastName, email, ...additionalInfo } = body || {}

    if (!firstName || !lastName || !email) {
      console.error("Missing required fields: firstName, lastName, or email")
      return NextResponse.json({ error: "First Name, Last Name, and email are required" }, { status: 400 })
    }

    try {
      const submissionResult = await handleFormSubmission(
        params.id,
        "attendee",
        { firstName, lastName, email, ...additionalInfo },
        null, // No user ID for public submissions
      )

      console.log("handleFormSubmission result:", submissionResult)

      return NextResponse.json({
        success: submissionResult.success,
        message: submissionResult.message,
        registrationId: submissionResult.submissionId,
      })
    } catch (submissionError: any) {
      console.error("Error in handleFormSubmission:", submissionError)
      return NextResponse.json(
        {
          error: "Form submission failed",
          details: submissionError.message || "Unknown submission error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error registering for event:", error)
    return NextResponse.json(
      {
        error: "An error occurred while registering for the event",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
