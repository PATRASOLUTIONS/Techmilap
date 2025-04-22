import { redirect } from "next/navigation"

export default function RegisterRedirectPage({ params }) {
  const eventId = params.id
  redirect(`/events/${eventId}/forms/register`)
}
