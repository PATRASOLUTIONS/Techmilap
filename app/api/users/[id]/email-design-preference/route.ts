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
      return NextResponse.
\
Let's create actual HTML templates for each design:
