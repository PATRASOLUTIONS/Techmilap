// Debug endpoint to test JSON response
export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`Debug form request received for event: ${params.id}`)

  // Set headers for all responses to ensure proper content type
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

  try {
    // Return a simple test response
    const responseData = {
      success: true,
      message: "Debug endpoint working correctly",
      timestamp: new Date().toISOString(),
      eventId: params.id,
    }

    console.log("Sending debug response")

    // Return the debug response
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error(`Error in debug endpoint:`, error)

    return new Response(
      JSON.stringify({
        success: false,
        error: "An error occurred in the debug endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers,
      },
    )
  }
}
