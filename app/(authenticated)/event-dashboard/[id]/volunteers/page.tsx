import { SubmissionsTable } from "@/components/dashboard/submissions-table"

interface VolunteersPageProps {
  params: {
    id: string
  }
}
export default function VolunteersPage({ params }: VolunteersPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Volunteer Applications</h1>
      <SubmissionsTable
        eventId={params.id}
        title="Volunteer Applications"
        formType="volunteer" // Specify the form type
        description="Review and manage volunteer applications for this event"
      />
    </div>
  )
}
