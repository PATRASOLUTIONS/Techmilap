import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    console.log("API: /api/auth/me called")
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("API: No session found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("API: Session found for user:", session.user.email)

    // Get additional user data from database if needed
    try {
      await connectToDatabase()
      const client = await connectToDatabase()
      const db = client.db()

      const userId = session.user.id
      console.log("API: Looking up user with ID:", userId)

      const user = await db.collection("users").findOne({
        _id: new ObjectId(userId),
      })

      if (!user) {
        console.log("API: User not found in database")
        // Return basic session data if user not found in DB
        return NextResponse.json({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role || "user",
          image: session.user.image,
        })
      }

      console.log("API: User found in database with role:", user.role)

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
      console.error("API: Database error:", dbError)
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
    console.error("API: Error in /api/auth/me route:", error)
    return NextResponse.json({ error: "An error occurred while fetching user data" }, { status: 500 })
  }
}
