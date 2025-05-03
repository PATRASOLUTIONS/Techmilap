import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import { sendEmail } from "@/lib/email-service"
import User from "@/models/User"

interface SendTemplatedEmailParams {
  userId: string
  templateType: string
  recipientEmail: string
  recipientName?: string
  eventId?: string
  variables: Record<string, string>
  customSubject?: string
}

// Add a function to get the user's design preference:
async function getUserDesignPreference(userId: string): Promise<string> {
  try {
    const user = await User.findById(userId).select("emailDesignPreference")
    return user?.emailDesignPreference || "modern"
  } catch (error) {
    console.error("Error getting user design preference:", error)
    return "modern" // Default to modern if there's an error
  }
}

// Export the getEmailTemplate function
export async function getEmailTemplate(userId: string, templateType: string, eventId?: string) {
  await connectToDatabase()

  // First try to find an event-specific template
  if (eventId) {
    const eventTemplate = await EmailTemplate.findOne({
      userId,
      templateType,
      eventId,
      isDefault: true,
    })

    if (eventTemplate) {
      return eventTemplate
    }
  }

  // Then try to find a default template for this user and type
  const defaultTemplate = await EmailTemplate.findOne({
    userId,
    templateType,
    isDefault: true,
  })

  if (defaultTemplate) {
    return defaultTemplate
  }

  // Finally, try to find any template of this type for the user
  const anyTemplate = await EmailTemplate.findOne({
    userId,
    templateType,
  })

  return anyTemplate
}

export async function sendTemplatedEmail({
  userId,
  templateType,
  recipientEmail,
  recipientName,
  eventId,
  variables,
  customSubject,
}: SendTemplatedEmailParams) {
  try {
    // Get the appropriate template
    const template = await getEmailTemplate(userId, templateType, eventId)

    if (!template) {
      throw new Error(`No template found for type: ${templateType}`)
    }

    // Replace variables in subject and content
    let subject = customSubject || template.subject
    let content = template.content

    // Replace all variables in the content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g")
      subject = subject.replace(regex, value)
      content = content.replace(regex, value)
    })

    // Apply the design template
    const htmlContent = applyDesignTemplate(content, template.designTemplate, recipientName)

    // Send the email
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      text: stripHtml(content),
      html: htmlContent,
    })

    return result
  } catch (error) {
    console.error("Error sending templated email:", error)
    throw error
  }
}

function applyDesignTemplate(content: string, designTemplate: string, recipientName?: string) {
  // Convert markdown to HTML (simplified version)
  const htmlContent = markdownToHtml(content)

  // Apply the selected design template
  switch (designTemplate) {
    case "modern":
      return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #4f46e5; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #6b7280; font-size: 16px;">Hello ${recipientName},</p>` : ""}
          <div style="color: #374151; font-size: 16px; line-height: 1.6;">
            ${htmlContent}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tech Milap. All rights reserved.</p>
          </div>
        </div>
      `
    case "elegant":
      return `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #fcfcfc; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: normal;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #4b5563; font-size: 17px;">Dear ${recipientName},</p>` : ""}
          <div style="color: #1f2937; font-size: 17px; line-height: 1.7;">
            ${htmlContent}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px; text-align: center;">
            <p>© ${new Date().getFullYear()} Tech Milap</p>
          </div>
        </div>
      `
    case "colorful":
      return `
        <div style="font-family: 'Verdana', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff; border-radius: 12px; border: 2px solid #bfdbfe;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #4b5563; font-size: 16px; font-weight: bold;">Hi ${recipientName}!</p>` : ""}
          <div style="color: #1f2937; font-size: 16px; line-height: 1.6; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);">
            ${htmlContent}
          </div>
          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tech Milap | <a href="#" style="color: #4f46e5; text-decoration: none;">Unsubscribe</a></p>
          </div>
        </div>
      `
    case "minimal":
      return `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          <div style="margin-bottom: 30px;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 500;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #374151; font-size: 16px;">Hello ${recipientName},</p>` : ""}
          <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
            ${htmlContent}
          </div>
          <div style="margin-top: 40px; color: #9ca3af; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tech Milap</p>
          </div>
        </div>
      `
    case "simple":
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${recipientName ? `<p>Hello ${recipientName},</p>` : ""}
          <div>
            ${htmlContent}
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Tech Milap. All rights reserved.</p>
          </div>
        </div>
      `
  }
}

// Simple markdown to HTML converter (this is a simplified version)
function markdownToHtml(markdown: string) {
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^- (.*$)/gm, "<ul><li>$1</li></ul>")
    // Links
    .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2">$1</a>')
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")

  // Wrap in paragraph tags if not already
  if (!html.startsWith("<h") && !html.startsWith("<p>")) {
    html = "<p>" + html + "</p>"
  }

  // Fix nested lists
  html = html.replace(/<\/ul>\s*<ul>/g, "")

  return html
}

// Strip HTML for plain text version
function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\n\n/g, "\n")
    .trim()
}
