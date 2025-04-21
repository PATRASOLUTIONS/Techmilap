import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Find the user but exclude the password field
    const user = await User.findOne({ email: session.user.email }).select("-password").lean()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Return user data without sensitive information
    return NextResponse.json(
      {
        message: "User found",
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          hasResetToken: !!user.resetPasswordToken,
          resetTokenExpired: user.resetPasswordTokenExpiry
            ? new Date(user.resetPasswordTokenExpiry) < new Date()
            : null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Debug user error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
