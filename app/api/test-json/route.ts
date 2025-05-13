// Simple JSON test endpoint
export async function GET() {
  console.log("Test JSON endpoint called")

  const data = {
    success: true,
    message: "This is a test JSON response",
    timestamp: new Date().toISOString(),
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
