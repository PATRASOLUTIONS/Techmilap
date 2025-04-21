import { redirect } from "next/navigation"

export default function SpeakerRedirectPage({ params }) {
  const eventId = params.id
  redirect(`/events/${eventId}/forms/speaker`)
}
