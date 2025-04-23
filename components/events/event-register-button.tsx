import { EventRegistrationDialog } from "./event-registration-dialog"

interface EventRegisterButtonProps {
  event: any
  className?: string
}

export function EventRegisterButton({ event, className = "" }: EventRegisterButtonProps) {
  return <EventRegistrationDialog eventId={event.slug || event._id} buttonText="Register" className={className} />
}
