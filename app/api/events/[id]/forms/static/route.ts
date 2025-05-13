// Static form data endpoint for testing
export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`Static form request received for event: ${params.id}`)

  // Set headers for all responses to ensure proper content type
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

  try {
    // Return a static form data response
    const responseData = {
      questions: [
        {
          id: "name",
          type: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          placeholder: "Enter your email address",
          required: true,
        },
        {
          id: "phone",
          type: "text",
          label: "Phone Number",
          placeholder: "Enter your phone number",
          required: false,
        },
        {
          id: "comments",
          type: "textarea",
          label: "Additional Comments",
          placeholder: "Any additional information you'd like to share",
          required: false,
        },
      ],
      status: "published",
      eventTitle: "Test Event for " + params.id,
      eventSlug: params.id,
      eventDate: new Date().toISOString(),
      startTime: "10:00",
      isEventPassed: false,
    }

    console.log("Sending static form data response")

    // Return the static response
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error(`Error in static form endpoint:`, error)

    return new Response(
      JSON.stringify({
        error: "An error occurred in the static form endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers,
      },
    )
  }
}
