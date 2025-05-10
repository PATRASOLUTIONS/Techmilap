import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import SentEmail from "@/models/SentEmail"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"
import mongoose from "mongoose"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 })
    }

    // Find the sent email
    const sentEmail = await SentEmail.findById(id)

    if (!sentEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    // Check if the user has permission to resend this email
    if (sentEmail.userId.toString() !== session.user.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You do not have permission to resend this email" }, { status: 403 })
    }

    // Resend the email
    const result = await sendEmail({
      to: sentEmail.recipientEmail,
      subject: sentEmail.subject,
      text: sentEmail.content.replace(/<[^>]*>/g, "").trim(), // Strip HTML for plain text
      html: sentEmail.content,
    })

    if (result) {
      // Update the sent email record
      sentEmail.status = "sent"
      sentEmail.updatedAt = new Date()
      await sentEmail.save()

      return NextResponse.json({ success: true, message: "Email resent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to resend email" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error resending email:", error)
    return NextResponse.json({ error: error.message || "An error occurred while resending the email" }, { status: 500 })
  }
}
