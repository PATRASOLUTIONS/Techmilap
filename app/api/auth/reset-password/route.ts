import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, password } = await request.json()

    if (!email || !resetToken || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters long" }, { status: 400 })
    }

    await connectToDatabase()

    // Find user by email and reset token
    const user = await User.findOne({
      email,
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 })
    }

    // Update user password and clear reset tokens
    // Let the User model's pre-save hook handle the password hashing
    user.password = password
    user.resetPasswordToken = null
    user.resetPasswordTokenExpiry = null
    user.resetPasswordOTP = null
    user.resetPasswordOTPExpiry = null

    try {
      await user.save()
      console.log("Password updated successfully for user:", email)
    } catch (saveError) {
      console.error("Error saving user after password reset:", saveError)
      return NextResponse.json({ message: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ message: "An error occurred while resetting password" }, { status: 500 })
  }
}
