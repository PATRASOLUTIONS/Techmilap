import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkUserEmailDesignPreference, setUserEmailDesignPreference } from "@/lib/debug-email-design"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 })
    }

    const result = await checkUserEmailDesignPreference(userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      userId,
      emailDesignPreference: result.preference,
    })
  } catch (error: any) {
    console.error("Error in debug email design route:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { userId, preference } = data

    if (!userId || !preference) {
      return NextResponse.json({ error: "userId and preference are required" }, { status: 400 })
    }

    const result = await setUserEmailDesignPreference(userId, preference)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error: any) {
    console.error("Error in debug email design route:", error)
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 })
  }
}
