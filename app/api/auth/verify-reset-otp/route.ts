import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ message: "Email and code are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user by email and OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired code" }, { status: 400 })
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")

    // Set token expiry to 30 minutes
    const tokenExpiry = new Date()
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30)

    // Save token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordTokenExpiry = tokenExpiry
    await user.save()

    return NextResponse.json(
      {
        message: "Code verified successfully",
        resetToken,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json({ message: "An error occurred while verifying the code" }, { status: 500 })
  }
}
