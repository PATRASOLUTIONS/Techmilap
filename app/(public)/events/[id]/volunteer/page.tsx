import { redirect } from "next/navigation"

export default async function VolunteerRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/events/${id}/forms/volunteer`)
}