import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json(
        { message: "If your email is registered, you will receive a reset code" },
        { status: 200 },
      )
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Set OTP expiry to 15 minutes
    const otpExpiry = new Date()
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 15)

    // Save OTP to user
    user.resetPasswordOTP = otp
    user.resetPasswordOTPExpiry = otpExpiry
    await user.save()

    // Send email with OTP
    await sendEmail({
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${otp}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset for your Tech Milap account.</p>
          <p>Your password reset code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ message: "If your email is registered, you will receive a reset code" }, { status: 200 })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ message: "An error occurred while processing your request" }, { status: 500 })
  }
}
