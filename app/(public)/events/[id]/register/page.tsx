import { redirect } from "next/navigation"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export default async function RegisterRedirectPage({ params }) {
  const eventId = params.id

  try {
    // Try to fetch the event to get the slug
    const client = await connectToDatabase()
    const db = client.db()

    // Check if the ID is a valid ObjectId
    let event
    try {
      if (ObjectId.isValid(eventId)) {
        event = await db.collection("events").findOne({
          _id: new ObjectId(eventId),
        })
      }

      // If not found by ID, try to find by slug
      if (!event) {
        event = await db.collection("events").findOne({
          slug: eventId,
        })
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    }

    // Use the slug if available, otherwise use the ID
    const eventIdentifier = event?.slug || eventId

    redirect(`/events/${eventIdentifier}/forms/register`)
  } catch (error) {
    console.error("Error in register redirect:", error)
    // Fallback to using the ID directly
    redirect(`/events/${eventId}/forms/register`)
  }
}
