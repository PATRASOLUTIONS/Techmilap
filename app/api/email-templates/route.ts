import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const templateType = searchParams.get("templateType")
    const eventId = searchParams.get("eventId")

    // Build query based on provided parameters
    const query: any = {}

    // Users can only access their own templates unless they're super-admin
    if (session.user.role !== "super-admin") {
      if (userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden: You can only access your own templates" }, { status: 403 })
      }
      query.userId = session.user.id // Always use the session user ID for non-admins
    } else if (userId) {
      query.userId = userId
    }

    if (templateType) {
      query.templateType = templateType
    }

    if (eventId) {
      query.eventId = eventId
    }

    const templates = await EmailTemplate.find(query).sort({ isDefault: -1, updatedAt: -1 })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching email templates" },
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

    // Only event planners and super admins can create templates
    if (session.user.role !== "event-planner" && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    await connectToDatabase()

    const data = await req.json()

    // Users can only create templates for themselves unless they're super-admin
    if (session.user.role !== "super-admin" && data.userId !== session.user.id) {
      // Force the userId to be the session user's ID for security
      data.userId = session.user.id
    }

    // Validate required fields
    if (!data.templateName || !data.templateType || !data.subject || !data.content) {
      return NextResponse.json(
        { error: "Missing required fields: templateName, templateType, subject, content" },
        { status: 400 },
      )
    }

    // Create new template
    const template = new EmailTemplate(data)
    await template.save()

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error("Error creating email template:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while creating the email template" },
      { status: 500 },
    )
  }
}
