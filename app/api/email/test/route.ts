import { type NextRequest, NextResponse } from "next/server"
import { sendGmailEmail, verifyGmailConnection } from "@/lib/gmail-service"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Get the session to ensure the user is authenticated
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { to, subject, text, html } = body

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: to, subject, and either text or html" },
        { status: 400 },
      )
    }

    // Send the email
    const result = await sendGmailEmail({
      to,
      subject,
      text,
      html,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to send email", error: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in email test API:", error)
    return NextResponse.json(
      { success: false, message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Add a GET endpoint to verify SMTP connection
export async function GET() {
  try {
    const result = await verifyGmailConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: process.env.EMAIL_SECURE === "true",
          user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : undefined,
          // Don't expose if password is set or not
          passwordConfigured: !!process.env.EMAIL_PASSWORD,
        },
      })
    } else {
      return NextResponse.json(
        { success: false, message: "SMTP verification failed", error: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error verifying SMTP connection:", error)
    return NextResponse.json(
      { success: false, message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
