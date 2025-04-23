import Link from "next/link"
import { Calendar, Users, Mic, HandHelping } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventEmptyStateProps {
  role?: string
  showCreateButton?: boolean
}

export function EventEmptyState({ role, showCreateButton = true }: EventEmptyStateProps) {
  let icon = <Calendar className="h-12 w-12 text-muted-foreground/50" />
  let title = "No events found"
  let description = "You don't have any events yet."
  let actionText = "Create an event"
  let actionLink = "/dashboard/events/create"

  switch (role) {
    case "attendee":
      icon = <Users className="h-12 w-12 text-muted-foreground/50" />
      title = "Not attending any events"
      description = "You haven't registered for any events as an attendee."
      actionText = "Explore events"
      actionLink = "/events"
      break
    case "volunteer":
      icon = <HandHelping className="h-12 w-12 text-muted-foreground/50" />
      title = "Not volunteering at any events"
      description = "You haven't signed up to volunteer at any events."
      actionText = "Explore volunteer opportunities"
      actionLink = "/events"
      break
    case "speaker":
      icon = <Mic className="h-12 w-12 text-muted-foreground/50" />
      title = "Not speaking at any events"
      description = "You haven't been registered as a speaker for any events."
      actionText = "Explore speaking opportunities"
      actionLink = "/events"
      break
    case "organizer":
      title = "No events organized"
      description = "You haven't created any events yet."
      break
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      {icon}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">{description}</p>
      {showCreateButton && (
        <Button asChild>
          <Link href={actionLink}>{actionText}</Link>
        </Button>
      )}
    </div>
  )
}
