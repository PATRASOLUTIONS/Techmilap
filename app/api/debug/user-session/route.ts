import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
      })
    }

    // Return session info with sensitive data removed
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        // Include other non-sensitive fields that might be useful
      },
    })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch session information",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
