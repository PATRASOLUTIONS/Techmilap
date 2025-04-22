import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User, { UserRole } from "@/models/User"
import { sendVerificationEmail } from "@/lib/email-service"

// Function to generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { firstName, lastName, email, password, role = UserRole.USER } = body

    console.log("Received signup request with role:", role)

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to the database
    try {
      await connectToDatabase()
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json({ error: "Database connection failed", status: 500 }, { status: 500 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Generate OTP for email verification
    const verificationCode = generateOTP()
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Create new user
    try {
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role,
        verificationCode,
        verificationCodeExpires,
        isVerified: false,
      })

      await user.save()

      // Send verification email
      try {
        await sendVerificationEmail(email, firstName, verificationCode)
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        // Continue with the signup process even if email fails
      }

      // Return success without exposing password or verification code
      return NextResponse.json(
        {
          success: true,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
          message: "User created successfully. Please check your email for verification code.",
        },
        { status: 201 },
      )
    } catch (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json({ error: userError.message || "Error creating user", status: 500 }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred during signup", status: 500 },
      { status: 500 },
    )
  }
}
