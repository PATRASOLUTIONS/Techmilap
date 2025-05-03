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

// Enhance the getUserDesignPreference function
async function getUserDesignPreference(userId: string): Promise<string> {
  try {
    await connectToDatabase()
    const user = await User.findById(userId).select("emailDesignPreference")

    if (!user) {
      console.warn(`User with ID ${userId} not found when getting design preference`)
      return "modern" // Default to modern if user not found
    }

    // Check if the preference is valid
    const validDesigns = ["modern", "elegant", "colorful", "minimal", "corporate"]
    if (user.emailDesignPreference && validDesigns.includes(user.emailDesignPreference)) {
      return user.emailDesignPreference
    } else {
      console.warn(`Invalid design preference "${user.emailDesignPreference}" for user ${userId}, using default`)
      return "modern"
    }
  } catch (error) {
    console.error(`Error getting design preference for user ${userId}:`, error)
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

    // Get the user's design preference
    const designPreference = await getUserDesignPreference(userId)

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
    const htmlContent = applyDesignTemplate(content, designPreference, recipientName)

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
  const currentYear = new Date().getFullYear()

  // Apply the selected design template
  switch (designTemplate) {
    case "modern":
      return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb; border-radius: 8px;">
          <div style="background-color: #4f46e5; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Tech Milap</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px 20px; border-radius: 0 0 8px 8px; margin-bottom: 1px;">
            ${recipientName ? `<p style="color: #6b7280; font-size: 16px; margin-top: 0;">Hello ${recipientName},</p>` : ""}
            <div style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${htmlContent}
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 14px;">
            <div style="margin-bottom: 10px;">
              <a href="#" style="display: inline-block; margin: 0 8px; color: #6b7280; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px; color: #6b7280; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px; color: #6b7280; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 24px; height: 24px;">
              </a>
            </div>
            <p style="margin: 0 0 10px 0;">© ${currentYear} Tech Milap. All rights reserved.</p>
            <p style="margin: 0; font-size: 12px;">
              <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> • 
              <a href="#" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a> • 
              <a href="#" style="color: #6b7280; text-decoration: underline;">Terms of Service</a>
            </p>
          </div>
        </div>
      `
    case "elegant":
      return `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #fcfcfc; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: normal; margin: 0;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #4b5563; font-size: 17px; margin-top: 0;">Dear ${recipientName},</p>` : ""}
          <div style="color: #1f2937; font-size: 17px; line-height: 1.7;">
            ${htmlContent}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px; text-align: center;">
            <p style="margin: 0 0 10px 0;">© ${currentYear} Tech Milap</p>
            <p style="margin: 0; font-size: 13px; font-style: italic;">
              "Bringing people together through memorable events"
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">
              <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> • 
              <a href="#" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `
    case "colorful":
      return `
        <div style="font-family: 'Verdana', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f0f9ff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">Tech Milap</h1>
          </div>
          <div style="padding: 30px 20px;">
            ${recipientName ? `<p style="color: #4b5563; font-size: 16px; font-weight: bold; margin-top: 0;">Hi ${recipientName}!</p>` : ""}
            <div style="color: #1f2937; font-size: 16px; line-height: 1.6; background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);">
              ${htmlContent}
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <div style="margin-bottom: 15px;">
              <a href="#" style="display: inline-block; margin: 0 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; width: 30px; height: 30px; line-height: 30px; text-align: center; border-radius: 50%;">
                <span style="font-size: 16px;">f</span>
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; width: 30px; height: 30px; line-height: 30px; text-align: center; border-radius: 50%;">
                <span style="font-size: 16px;">t</span>
              </a>
              <a href="#" style="display: inline-block; margin: 0 8px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; width: 30px; height: 30px; line-height: 30px; text-align: center; border-radius: 50%;">
                <span style="font-size: 16px;">in</span>
              </a>
            </div>
            <p style="margin: 0 0 10px 0;">© ${currentYear} Tech Milap | <a href="#" style="color: #4f46e5; text-decoration: none;">Unsubscribe</a></p>
          </div>
        </div>
      `
    case "minimal":
      return `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          <div style="margin-bottom: 30px;">
            <h1 style="color: #111827; font-size: 22px; font-weight: 500; margin: 0;">Tech Milap</h1>
          </div>
          ${recipientName ? `<p style="color: #374151; font-size: 16px; margin-top: 0;">Hello ${recipientName},</p>` : ""}
          <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
            ${htmlContent}
          </div>
          <div style="margin-top: 40px; color: #9ca3af; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">© ${currentYear} Tech Milap</p>
            <p style="margin: 0; font-size: 12px;">
              <a href="#" style="color: #9ca3af; text-decoration: none; border-bottom: 1px solid #9ca3af;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `
    case "corporate":
      return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <div style="background-color: #1e3a8a; padding: 25px 20px; text-align: left;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Tech Milap</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px 20px;">
            ${recipientName ? `<p style="color: #475569; font-size: 16px; margin-top: 0;">Dear ${recipientName},</p>` : ""}
            <div style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              ${htmlContent}
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: left; color: #64748b; font-size: 14px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin: 0 0 10px 0;">© ${currentYear} Tech Milap</p>
                  <p style="margin: 0; font-size: 12px;">
                    123 Business Avenue, Suite 100<br>
                    New York, NY 10001
                  </p>
                </td>
                <td align="right" valign="top">
                  <p style="margin: 0; font-size: 12px;">
                    <a href="#" style="color: #64748b; text-decoration: none;">Privacy</a> |
                    <a href="#" style="color: #64748b; text-decoration: none;">Terms</a> |
                    <a href="#" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </table>
          </div>
        </div>
      `
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${recipientName ? `<p>Hello ${recipientName},</p>` : ""}
          <div>
            ${htmlContent}
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
            <p>© ${currentYear} Tech Milap. All rights reserved.</p>
          </div>
        </div>
      `
  }
}

// Enhanced markdown to HTML converter
function markdownToHtml(markdown: string) {
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gm, "<h1 style='font-size: 24px; font-weight: bold; margin: 20px 0 10px 0;'>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2 style='font-size: 20px; font-weight: bold; margin: 18px 0 9px 0;'>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3 style='font-size: 18px; font-weight: bold; margin: 16px 0 8px 0;'>$1</h3>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Lists
    .replace(/^- (.*$)/gm, "<li style='margin-bottom: 5px;'>$1</li>")
    // Links
    .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" style="color: #4f46e5; text-decoration: none;">$1</a>')
    // Paragraphs
    .replace(/\n\n/g, "</p><p style='margin: 10px 0;'>")

  // Wrap in paragraph tags if not already
  if (!html.startsWith("<h") && !html.startsWith("<p")) {
    html = "<p style='margin: 10px 0;'>" + html + "</p>"
  }

  // Fix lists
  html = html
    .replace(/<li/g, "<ul style='margin: 10px 0; padding-left: 20px;'><li")
    .replace(/<\/li>/g, "</li></ul>")
    .replace(/<\/ul>\s*<ul[^>]*>/g, "")

  return html
}

// Strip HTML for plain text version
function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\n\n/g, "\n")
    .trim()
}
