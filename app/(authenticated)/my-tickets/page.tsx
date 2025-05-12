"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import TicketList from "@/components/tickets/ticket-list"
import EmptyTickets from "@/components/tickets/empty-tickets"

export default function MyTicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchTickets()
    }
  }, [status, router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tickets/my-tickets")
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets || [])
      } else {
        console.error("Failed to fetch tickets:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch tickets",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your tickets...</p>
      </div>
    )
  }

  if (!tickets || tickets.length === 0) {
    return <EmptyTickets />
  }

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground mt-2">View and manage all your event tickets in one place.</p>
        </div>

        <TicketList tickets={tickets} />
      </div>
    </div>
  )
}
