import { redirect } from "next/navigation"

export default function VolunteerRedirectPage({ params }) {
  const eventId = params.id
  redirect(`/events/${eventId}/forms/volunteer`)
}
