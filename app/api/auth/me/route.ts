import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get additional user data from database
    try {
      const client = await connectToDatabase()
      const db = client.db()

      const userId = session.user.id
      const user = await db.collection("users").findOne({
        _id: new ObjectId(userId),
      })

      if (!user) {
        // Return basic session data if user not found in DB
        return NextResponse.json({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "user",
          image: session.user.image,
        })
      }

      // Return enhanced user data
      return NextResponse.json({
        id: session.user.id,
        name: session.user.name || `${user.firstName} ${user.lastName}`,
        email: session.user.email,
        role: session.user.role || user.role || "user",
        image: session.user.image || user.profileImage,
        isVerified: user.isVerified,
      })
    } catch (dbError) {
      // Fallback to session data if DB lookup fails
      return NextResponse.json({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "user",
        image: session.user.image,
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 })
  }
}
