import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { sendCongratulationsEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 200 })
    }

    // Check if verification code is valid and not expired
    if (user.verificationCode !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    if (user.verificationCodeExpires < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 })
    }

    // Mark user as verified
    user.isVerified = true
    user.verificationCode = undefined
    user.verificationCodeExpires = undefined
    await user.save()

    // Send congratulations email
    try {
      await sendCongratulationsEmail(user.email, user.firstName, user.role)
    } catch (emailError) {
      console.error("Error sending congratulations email:", emailError)
      // Continue with the verification process even if email fails
    }

    return NextResponse.json({ success: true, message: "Email verified successfully" })
  } catch (error: any) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: error.message || "An error occurred during email verification" }, { status: 500 })
  }
}
