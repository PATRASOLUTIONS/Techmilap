import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EventNotFound() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
      <p className="mb-6">We couldn't find the event you're looking for.</p>
      <Button asChild>
        <Link href="/events">Browse Events</Link>
      </Button>
    </div>
  )
}
