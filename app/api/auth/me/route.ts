import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Return user information from the session
    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      image: session.user.image,
    })
  } catch (error) {
    console.error("Error in /api/auth/me route:", error)
    return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 })
  }
}
