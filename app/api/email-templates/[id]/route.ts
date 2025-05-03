import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    }

    const template = await EmailTemplate.findById(id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Users can only access their own templates unless they're super-admin
    if (session.user.role !== "super-admin" && template.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this template" },
        { status: 403 },
      )
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error fetching email template:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the email template" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    }

    const template = await EmailTemplate.findById(id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Users can only update their own templates unless they're super-admin
    if (session.user.role !== "super-admin" && template.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update this template" },
        { status: 403 },
      )
    }

    const data = await req.json()

    // Validate required fields
    if (!data.templateName || !data.templateType || !data.subject || !data.content) {
      return NextResponse.json(
        { error: "Missing required fields: templateName, templateType, subject, content" },
        { status: 400 },
      )
    }

    // Update template
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    )

    return NextResponse.json({ success: true, template: updatedTemplate })
  } catch (error: any) {
    console.error("Error updating email template:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the email template" },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid template ID" }, { status: 400 })
    }

    const template = await EmailTemplate.findById(id)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Users can only delete their own templates unless they're super-admin
    if (session.user.role !== "super-admin" && template.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete this template" },
        { status: 403 },
      )
    }

    await EmailTemplate.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "Template deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting email template:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while deleting the email template" },
      { status: 500 },
    )
  }
}
