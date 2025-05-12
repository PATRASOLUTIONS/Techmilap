import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import User from "@/models/User"

/**
 * Initialize default email templates and design preferences for a new user
 * @param userId The ID of the user to initialize defaults for
 */
export async function initializeEmailDefaults(userId: string) {
  try {
    await connectToDatabase()
    console.log(`Initializing email defaults for user ${userId}`)

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      console.error(`User ${userId} not found when initializing email defaults`)
      return false
    }

    // Set default design preference if not already set
    if (!user.emailDesignPreference) {
      user.emailDesignPreference = "modern"
      await user.save()
      console.log(`Set default email design preference to "modern" for user ${userId}`)
    }

    // Check if user already has templates
    const existingTemplates = await EmailTemplate.countDocuments({ userId })
    if (existingTemplates > 0) {
      console.log(`User ${userId} already has ${existingTemplates} email templates, skipping initialization`)
      return true
    }

    // Create default templates for common types
    const templateTypes = ["success", "rejection", "ticket", "certificate", "reminder"]
    const templates = []

    for (const type of templateTypes) {
      const template = new EmailTemplate({
        userId,
        templateName: `Default ${type.charAt(0).toUpperCase() + type.slice(1)} Template`,
        templateType: type,
        designTemplate: user.emailDesignPreference,
        subject: getDefaultSubject(type),
        content: getDefaultContent(type),
        isDefault: true,
        variables: getDefaultVariables(type),
      })

      templates.push(template)
    }

    // Save all templates
    await EmailTemplate.insertMany(templates)
    console.log(`Created ${templates.length} default email templates for user ${userId}`)

    return true
  } catch (error) {
    console.error(`Error initializing email defaults for user ${userId}:`, error)
    return false
  }
}

function getDefaultSubject(type: string): string {
  switch (type) {
    case "success":
      return "Your Registration Has Been Approved"
    case "rejection":
      return "Update Regarding Your Registration"
    case "ticket":
      return "Your Event Ticket"
    case "certificate":
      return "Your Certificate of Participation"
    case "reminder":
      return "Reminder: Upcoming Event"
    default:
      return "Important Information About Your Event"
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
      return [...commonVars, "ticketId", "ticketUrl"]
    case "certificate":
      return [...commonVars, "certificateId"]
    default:
      return commonVars
  }
}
