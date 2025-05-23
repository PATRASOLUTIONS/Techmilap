import { redirect } from "next/navigation"

export default async function SpeakerRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/events/${id}/forms/speaker`)
}