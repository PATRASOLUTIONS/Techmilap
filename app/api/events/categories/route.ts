import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Event from "@/models/Event"

export async function GET() {
  try {
    await connectToDatabase()

    // Get distinct categories from events
    const categories = await Event.distinct("category")

    // Filter out null or empty categories
    const validCategories = categories.filter((category) => category && category.trim() !== "")

    return NextResponse.json({
      categories: validCategories,
    })
  } catch (error: any) {
    console.error("Error fetching event categories:", error)
    return NextResponse.json({ error: error.message || "An error occurred while fetching categories" }, { status: 500 })
  }
}
