import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const url = new URL(req.url)
    const filterPast = url.searchParams.get("past") === "true"

    const currentDate = new Date()

    let query = {}

    // If filtering for past events
    if (filterPast) {
      query = { date: { $lt: currentDate } }
    }

    const events = await Event.find(query).sort({ date: filterPast ? -1 : 1 })

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching events" }, { status: 500 })
  }
}
