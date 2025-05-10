import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import SentEmail from "@/models/SentEmail"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Parse query parameters
    const url = new URL(req.url)
    const eventId = url.searchParams.get("eventId")
    const emailType = url.searchParams.get("emailType")
    const recipientEmail = url.searchParams.get("recipientEmail")
    const status = url.searchParams.get("status")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Build query
    const query: any = { userId: session.user.id }

    if (eventId) query.eventId = eventId
    if (emailType) query.emailType = emailType
    if (recipientEmail) query.recipientEmail = recipientEmail
    if (status) query.status = status

    // Get total count for pagination
    const totalCount = await SentEmail.countDocuments(query)

    // Get emails with pagination
    const emails = await SentEmail.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

    return NextResponse.json({
      emails,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching sent emails:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching sent emails" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const data = await req.json()

    // Validate required fields
    if (!data.recipientEmail || !data.subject || !data.content || !data.emailType) {
      return NextResponse.json(
        { error: "Missing required fields: recipientEmail, subject, content, emailType" },
        { status: 400 },
      )
    }

    // Create new sent email record
    const sentEmail = new SentEmail({
      userId: session.user.id,
      eventId: data.eventId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject: data.subject,
      content: data.content,
      templateId: data.templateId,
      designTemplate: data.designTemplate,
      emailType: data.emailType,
      status: data.status || "pending",
      metadata: data.metadata || {},
    })

    await sentEmail.save()

    return NextResponse.json({ success: true, sentEmail })
  } catch (error: any) {
    console.error("Error creating sent email record:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while creating sent email record" },
      { status: 500 },
    )
  }
}
