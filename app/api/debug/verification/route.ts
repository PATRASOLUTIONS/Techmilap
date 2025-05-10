import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user and explicitly select verification fields
    const user = await User.findOne({ email }).select("+verificationCode +verificationCodeExpires")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return verification details
    return NextResponse.json({
      email: user.email,
      isVerified: user.isVerified,
      verificationCode: user.verificationCode,
      verificationCodeExpires: user.verificationCodeExpires,
      isExpired: user.verificationCodeExpires < new Date(),
      currentTime: new Date(),
    })
  } catch (error: any) {
    console.error("Debug verification error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
