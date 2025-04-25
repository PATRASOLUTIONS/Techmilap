import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendAttendeeApprovalEmail, sendVolunteerApprovalEmail, sendSpeakerApprovalEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let success = false
    let message = ""

    // Send the appropriate notification based on type
    switch (type) {
      case "attendee-approval":
        success = await sendAttendeeApprovalEmail(data)
        message = "Attendee approval notification sent"
        break
      case "attendee-rejection":
        // For rejections, we'll use the same function but modify the message
        data.additionalInfo =
          data.additionalInfo ||
          "Thank you for your interest in our event. Unfortunately, we cannot accommodate your registration at this time."
        success = await sendAttendeeApprovalEmail({
          ...data,
          ticketType: "Rejected",
        })
        message = "Attendee rejection notification sent"
        break
      case "volunteer-approval":
        success = await sendVolunteerApprovalEmail(data)
        message = "Volunteer approval notification sent"
        break
      case "volunteer-rejection":
        data.additionalInfo =
          data.additionalInfo ||
          "Thank you for your interest in volunteering. Unfortunately, we cannot accommodate your application at this time."
        success = await sendVolunteerApprovalEmail({
          ...data,
          volunteerRole: "Rejected",
        })
        message = "Volunteer rejection notification sent"
        break
      case "speaker-approval":
        success = await sendSpeakerApprovalEmail(data)
        message = "Speaker approval notification sent"
        break
      case "speaker-rejection":
        data.additionalInfo =
          data.additionalInfo ||
          "Thank you for your interest in speaking at our event. Unfortunately, we cannot accommodate your application at this time."
        success = await sendSpeakerApprovalEmail({
          ...data,
          presentationTitle: "Rejected",
        })
        message = "Speaker rejection notification sent"
        break
      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ success: true, message })
    } else {
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while sending notification" },
      { status: 500 },
    )
  }
}
