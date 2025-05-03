import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// This is a debug endpoint for super admins to check email templates

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized: Super admin access required" }, { status: 403 })
    }

    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const templateType = searchParams.get("templateType")
    const showAll = searchParams.get("showAll") === "true"

    // Build query based on provided parameters
    const query: any = {}

    if (userId) {
      query.userId = userId
    }

    if (templateType) {
      query.templateType = templateType
    }

    const templates = await EmailTemplate.find(query)
      .sort({ userId: 1, templateType: 1, isDefault: -1, updatedAt: -1 })
      .populate("userId", "name email")
      .lean()

    // Group templates by user if showAll is true
    if (showAll) {
      const templatesByUser: Record<string, any> = {}

      templates.forEach((template) => {
        const userId = template.userId._id.toString()
        if (!templatesByUser[userId]) {
          templatesByUser[userId] = {
            user: {
              id: userId,
              name: template.userId.name,
              email: template.userId.email,
            },
            templates: [],
          }
        }

        templatesByUser[userId].templates.push({
          ...template,
          userId: undefined, // Remove the populated user object to avoid duplication
        })
      })

      return NextResponse.json({ templatesByUser: Object.values(templatesByUser) })
    }

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("Error in debug email templates endpoint:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching email templates" },
      { status: 500 },
    )
  }
}

// Create default templates for a user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized: Super admin access required" }, { status: 403 })
    }

    await connectToDatabase()

    const { userId, templateType } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Create default templates for the specified user
    const results = await createDefaultTemplatesForUser(userId, templateType)

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Error creating default templates:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while creating default templates" },
      { status: 500 },
    )
  }
}

// Helper function to create default templates for a user
async function createDefaultTemplatesForUser(userId: string, specificType?: string) {
  const templateTypes = specificType
    ? [specificType]
    : ["success", "rejection", "ticket", "certificate", "reminder", "custom"]

  const results = []

  for (const templateType of templateTypes) {
    // Check if user already has a default template of this type
    const existingTemplate = await EmailTemplate.findOne({
      userId,
      templateType,
      isDefault: true,
    })

    if (!existingTemplate) {
      // Create a default template
      const defaultTemplate = {
        userId,
        templateName: `Default ${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template`,
        templateType,
        designTemplate: "modern",
        subject: getDefaultSubject(templateType),
        content: getDefaultContent(templateType),
        isDefault: true,
        variables: getDefaultVariables(templateType),
      }

      const template = new EmailTemplate(defaultTemplate)
      await template.save()

      results.push({
        templateType,
        action: "created",
        templateId: template._id,
      })
    } else {
      results.push({
        templateType,
        action: "skipped",
        templateId: existingTemplate._id,
        reason: "Default template already exists",
      })
    }
  }

  return results
}

function getDefaultSubject(type: string): string {
  switch (type) {
    case "success":
      return "Your registration for {{eventName}} has been confirmed!"
    case "rejection":
      return "Regarding your registration for {{eventName}}"
    case "ticket":
      return "Your ticket for {{eventName}}"
    case "certificate":
      return "Your Certificate of Participation - {{eventName}}"
    case "reminder":
      return "Reminder: {{eventName}} is coming up soon!"
    default:
      return "Information about {{eventName}}"
  }
}

function getDefaultContent(type: string): string {
  switch (type) {
    case "success":
      return "Dear {{attendeeName}},\n\nYour registration for **{{eventName}}** has been confirmed!\n\n**Event Details:**\n- Date: {{eventDate}}\n- Time: {{eventTime}}\n- Location: {{eventLocation}}\n\nWe look forward to seeing you there!\n\nBest regards,\n{{organizerName}}"
    case "rejection":
      return "Dear {{attendeeName}},\n\nThank you for your interest in **{{eventName}}**.\n\nWe regret to inform you that we are unable to confirm your registration at this time.\n\nPlease contact us if you have any questions.\n\nBest regards,\n{{organizerName}}"
    case "ticket":
      return "# Event Ticket\n\n**{{eventName}}**\n\nAttendee: {{attendeeName}}\nTicket ID: {{ticketId}}\nDate: {{eventDate}}\nTime: {{eventTime}}\nLocation: {{eventLocation}}\n\n*Please present this ticket at the event entrance.*"
    case "certificate":
      return "# Certificate of Participation\n\nThis is to certify that\n\n**{{attendeeName}}**\n\nhas successfully participated in\n\n**{{eventName}}**\n\nheld on {{eventDate}} at {{eventLocation}}.\n\n{{organizerName}}\nEvent Organizer"
    case "reminder":
      return "Dear {{attendeeName}},\n\nThis is a friendly reminder about the upcoming event:\n\n**{{eventName}}**\n\n**Event Details:**\n- Date: {{eventDate}}\n- Time: {{eventTime}}\n- Location: {{eventLocation}}\n\nWe look forward to seeing you there!\n\nBest regards,\n{{organizerName}}"
    default:
      return "Dear {{recipientName}},\n\nThank you for your interest in our events.\n\n{{customMessage}}\n\nBest regards,\n{{organizerName}}"
  }
}

function getDefaultVariables(type: string): string[] {
  const commonVars = ["attendeeName", "eventName", "eventDate", "eventTime", "eventLocation", "organizerName"]

  switch (type) {
    case "ticket":
      return [...commonVars, "ticketId"]
    case "certificate":
      return [...commonVars, "certificateId"]
    case "custom":
      return ["recipientName", "customMessage", "organizerName"]
    default:
      return commonVars
  }
}
