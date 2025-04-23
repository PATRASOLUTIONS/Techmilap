import { type NextRequest, NextResponse } from "next/server"
import { sendContactFormEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Send email
    const success = await sendContactFormEmail({
      name,
      email,
      message,
    })

    if (!success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Contact form submission error:", error)
    return NextResponse.json({ message: "An error occurred while submitting the form" }, { status: 500 })
  }
}
