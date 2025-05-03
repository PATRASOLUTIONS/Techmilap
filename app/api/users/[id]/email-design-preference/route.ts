import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import User from "@/models/User"
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
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Users can only access their own preferences unless they're super-admin
    if (session.user.role !== "super-admin" && id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this user's preferences" },
        { status: 403 },
      )
    }

    const user = await User.findById(id).select("emailDesignPreference")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      preference: user.emailDesignPreference || "modern",
    })
  } catch (error: any) {
    console.error("Error fetching user email design preference:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while fetching the user's email design preference" },
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
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Users can only update their own preferences unless they're super-admin
    if (session.user.role !== "super-admin" && id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update this user's preferences" },
        { status: 403 },
      )
    }

    const data = await req.json()

    if (!data.designPreference) {
      return NextResponse.json({ error: "Design preference is required" }, { status: 400 })
    }

    // Validate design preference
    const validDesigns = ["modern", "elegant", "colorful", "minimal", "corporate"]
    if (!validDesigns.includes(data.designPreference)) {
      return NextResponse.json({ error: "Invalid design preference" }, { status: 400 })
    }

    // Update user's email design preference
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { emailDesignPreference: data.designPreference } },
      { new: true, runValidators: true },
    ).select("emailDesignPreference")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      preference: updatedUser.emailDesignPreference,
      message: "Email design preference updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating user email design preference:", error)
    return NextResponse.json(
      { error: error.message || "An error occurred while updating the user's email design preference" },
      { status: 500 },
    )
  }
}
