import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TicketList } from "@/components/tickets/ticket-list"

async function getMyTickets(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tickets/my-tickets`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch tickets")
    }

    const data = await response.json()
    return data.tickets || []
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return []
  }
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const tickets = await getMyTickets(session.user.id)

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} found
        </p>
      </div>

      <TicketList tickets={tickets} />
    </div>
  )
}
