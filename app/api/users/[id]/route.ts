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

    // Users can only access their own data unless they're super-admin
    if (session.user.id !== params.id && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this user data" },
        { status: 403 },
      )
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const user = await User.findById(id).select("-password")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching the user" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only update their own data unless they're super-admin
    if (session.user.id !== params.id && session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: You do not have permission to update this user" }, { status: 403 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const updateData = await req.json()

    // Don't allow role changes unless super-admin
    if (updateData.role && session.user.role !== "super-admin") {
      delete updateData.role
    }

    // If updating password, it will be hashed by the pre-save hook

    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "_id" && key !== "password") {
        user[key] = updateData[key]
      }
    })

    // Handle password separately if provided
    if (updateData.password) {
      user.password = updateData.password
    }

    await user.save()

    // Return updated user without password
    const updatedUser = await User.findById(id).select("-password")

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message || "An error occurred while updating the user" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only super-admin can delete users
    if (session.user.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
    }

    await connectToDatabase()

    const id = params.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await User.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "An error occurred while deleting the user" }, { status: 500 })
  }
}
