import { NextResponse, type NextRequest } from "next/server"
import { connectToDatabase, getDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const db = await getDatabase()

    // Get collection names
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    // Check if formSubmissions collection exists
    const hasFormSubmissions = collectionNames.includes("formSubmissions")

    let formSubmissionsData = null
    let sampleSubmission = null

    if (hasFormSubmissions) {
      // Get count of submissions
      const count = await db.collection("formSubmissions").countDocuments()

      // Get a sample submission
      sampleSubmission = await db.collection("formSubmissions").findOne()

      // Get field names from sample
      const fieldNames = sampleSubmission ? Object.keys(sampleSubmission) : []

      formSubmissionsData = {
        count,
        fieldNames,
        sampleDocument: sampleSubmission,
      }
    }

    return NextResponse.json({
      collections: collectionNames,
      hasFormSubmissions,
      formSubmissionsData,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
