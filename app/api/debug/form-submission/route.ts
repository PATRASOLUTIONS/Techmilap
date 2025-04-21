import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    console.log("Debug form submission endpoint called")

    // Get the raw request body
    const rawText = await req.text()
    console.log("Raw request body:", rawText)

    // Try to parse as JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(rawText)
      console.log("Successfully parsed JSON:", parsedBody)
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError)
      return NextResponse.json({
        success: false,
        error: "Invalid JSON",
        rawBody: rawText,
      })
    }

    // Try to connect to the database
    try {
      const { db } = await connectToDatabase()
      console.log("Successfully connected to database")

      // Try a simple database operation
      const stats = await db.stats()
      console.log("Database stats:", stats)

      // Try to insert a test document
      const testResult = await db.collection("debug_logs").insertOne({
        type: "form_submission_test",
        data: parsedBody,
        timestamp: new Date(),
      })

      console.log("Test document inserted:", testResult.insertedId)

      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        testDocumentId: testResult.insertedId,
        parsedBody,
      })
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: dbError.message,
        parsedBody,
      })
    }
  } catch (error) {
    console.error("Unexpected error in debug endpoint:", error)
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error.message,
    })
  }
}
