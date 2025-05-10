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

    // Find all other templates of the same type for this user and set isDefault to false
    await EmailTemplate.updateMany(
      {
        userId: template.userId,
        templateType: template.templateType,
        _id: { $ne: template._id },
        isDefault: true,
      },
      { $set: { isDefault: false } },
    )

    // Set this template as default
    template.isDefault = true
    await template.save()

    return NextResponse.json({ success: true, template })
  } catch (error: any) {
    console.error("Error setting template as default:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while setting the template as default" },
      { status: 500 },
    )
  }
}
