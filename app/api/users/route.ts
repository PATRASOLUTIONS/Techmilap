import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only super-admin can list all users
    if (session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")

    const query: any = {}
    if (role) query.role = role

    const users = await User.find(query).select("-password").sort({ createdAt: -1 })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching users" }, { status: 500 })
  }
}
