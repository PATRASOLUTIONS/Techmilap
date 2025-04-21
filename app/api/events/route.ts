import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const events = await Event.find({}).sort({ date: 1 })

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching events" }, { status: 500 })
  }
}
