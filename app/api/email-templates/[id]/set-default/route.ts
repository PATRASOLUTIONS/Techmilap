import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import EmailTemplate from "@/models/EmailTemplate"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"

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

    // First, unset default for all templates of the same type for this user
    await EmailTemplate.updateMany(
      {
        userId: template.userId,
        templateType: template.templateType,
        isDefault: true,
      },
      { $set: { isDefault: false } },
    )

    // Then set this template as default
    template.isDefault = true
    await template.save()

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error("Error setting default template:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while setting the default template" },
      { status: 500 },
    )
  }
}
