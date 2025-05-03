import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { modernTemplate } from "./email-templates/modern-template"
import { elegantTemplate } from "./email-templates/elegant-template"
import { colorfulTemplate } from "./email-templates/colorful-template"
import { minimalTemplate } from "./email-templates/minimal-template"
import { corporateTemplate } from "./email-templates/corporate-template"

// Template types
export type EmailTemplateType = "success" | "rejection" | "ticket" | "certificate" | "reminder" | "custom"

// Design types
export type EmailDesignType = "modern" | "elegant" | "colorful" | "minimal" | "corporate"

// Interface for email template
export interface EmailTemplate {
  _id?: string | ObjectId
  userId: string | ObjectId
  name: string
  type: EmailTemplateType
  subject: string
  content: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Get email template by type and user ID
export async function getEmailTemplate(type: EmailTemplateType, userId: string) {
  try {
    const { db } = await connectToDatabase()

    // Find the default template for this type and user
    const template = await db.collection("emailTemplates").findOne({
      userId: new ObjectId(userId),
      type,
      isDefault: true,
    })

    return template
  } catch (error) {
    console.error("Error getting email template:", error)
    return null
  }
}

// Apply design template to content
export function applyDesignTemplate(content: string, subject: string, design: EmailDesignType) {
  switch (design) {
    case "modern":
      return modernTemplate(content, subject)
    case "elegant":
      return elegantTemplate(content, subject)
    case "colorful":
      return colorfulTemplate(content, subject)
    case "minimal":
      return minimalTemplate(content, subject)
    case "corporate":
      return corporateTemplate(content, subject)
    default:
      return modernTemplate(content, subject) // Default to modern
  }
}

// Replace variables in template content
export function replaceTemplateVariables(content: string, variables: Record<string, string>) {
  let result = content

  // Replace each variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g")
    result = result.replace(regex, value)
  })

  return result
}

// Create a new email template
export async function createEmailTemplate(template: Omit<EmailTemplate, "_id" | "createdAt" | "updatedAt">) {
  try {
    const { db } = await connectToDatabase()

    // If this is set as default, unset any other default for this type
    if (template.isDefault) {
      await db
        .collection("emailTemplates")
        .updateMany(
          { userId: new ObjectId(template.userId.toString()), type: template.type },
          { $set: { isDefault: false } },
        )
    }

    const result = await db.collection("emailTemplates").insertOne({
      ...template,
      userId: new ObjectId(template.userId.toString()),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return result
  } catch (error) {
    console.error("Error creating email template:", error)
    throw error
  }
}

// Update an existing email template
export async function updateEmailTemplate(id: string, updates: Partial<EmailTemplate>) {
  try {
    const { db } = await connectToDatabase()

    // If this is set as default, unset any other default for this type
    if (updates.isDefault) {
      const template = await db.collection("emailTemplates").findOne({ _id: new ObjectId(id) })
      if (template) {
        await db.collection("emailTemplates").updateMany(
          {
            userId: template.userId,
            type: template.type,
            _id: { $ne: new ObjectId(id) },
          },
          { $set: { isDefault: false } },
        )
      }
    }

    const result = await db.collection("emailTemplates").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    return result
  } catch (error) {
    console.error("Error updating email template:", error)
    throw error
  }
}

// Delete an email template
export async function deleteEmailTemplate(id: string) {
  try {
    const { db } = await connectToDatabase()
    const result = await db.collection("emailTemplates").deleteOne({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    console.error("Error deleting email template:", error)
    throw error
  }
}

// Get all templates for a user
export async function getUserEmailTemplates(userId: string) {
  try {
    const { db } = await connectToDatabase()
    const templates = await db
      .collection("emailTemplates")
      .find({ userId: new ObjectId(userId) })
      .sort({ type: 1, createdAt: -1 })
      .toArray()

    return templates
  } catch (error) {
    console.error("Error getting user email templates:", error)
    return []
  }
}

// Set a template as default
export async function setDefaultTemplate(id: string) {
  try {
    const { db } = await connectToDatabase()

    // Get the template to find its type and userId
    const template = await db.collection("emailTemplates").findOne({ _id: new ObjectId(id) })

    if (!template) {
      throw new Error("Template not found")
    }

    // Unset any other default for this type and user
    await db.collection("emailTemplates").updateMany(
      {
        userId: template.userId,
        type: template.type,
      },
      { $set: { isDefault: false } },
    )

    // Set this template as default
    const result = await db
      .collection("emailTemplates")
      .updateOne({ _id: new ObjectId(id) }, { $set: { isDefault: true, updatedAt: new Date() } })

    return result
  } catch (error) {
    console.error("Error setting default template:", error)
    throw error
  }
}

// Get user's design preference
export async function getUserDesignPreference(userId: string): Promise<EmailDesignType> {
  try {
    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })

    return user?.emailDesignPreference || "modern" // Default to modern if not set
  } catch (error) {
    console.error("Error getting user design preference:", error)
    return "modern" // Default to modern on error
  }
}

// Prepare email with template and design
export async function prepareEmail(type: EmailTemplateType, userId: string, variables: Record<string, string>) {
  try {
    // Get the template
    const template = await getEmailTemplate(type, userId)

    if (!template) {
      throw new Error(`No template found for type: ${type}`)
    }

    // Get user's design preference
    const designPreference = await getUserDesignPreference(userId)

    // Replace variables in content and subject
    const content = replaceTemplateVariables(template.content, variables)
    const subject = replaceTemplateVariables(template.subject, variables)

    // Apply design template
    const html = applyDesignTemplate(content, subject, designPreference)

    return {
      subject,
      html,
      text: content.replace(/<[^>]*>/g, ""), // Simple HTML to text conversion
    }
  } catch (error) {
    console.error("Error preparing email:", error)
    throw error
  }
}
