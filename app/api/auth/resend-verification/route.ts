import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
import { sendVerificationEmail } from "@/lib/email-service"

// Function to generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 200 })
    }

    // Generate new OTP
    const verificationCode = generateOTP()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Update user with new verification code
    user.verificationCode = verificationCode
    user.verificationCodeExpires = verificationCodeExpires
    await user.save()

    // Send verification email
    try {
      await sendVerificationEmail(email, user.firstName, verificationCode)
    } catch (emailError) {
      console.error("Error sending verification email:", emailError)
      return NextResponse.json({ error: "Failed to send verification email. Please try again later." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully. Please check your email.",
    })
  } catch (error: any) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while resending verification code" },
      { status: 500 },
    )
  }
}
