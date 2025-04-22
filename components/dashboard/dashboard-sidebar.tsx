"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Home,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Users,
  FileText,
  FormInput,
} from "lucide-react"

interface DashboardSidebarProps {
  eventId?: string
  className?: string
}

export function DashboardSidebar({ eventId, className }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isEventDashboard = pathname?.includes("/event-dashboard/")
  const isMainDashboard = pathname?.includes("/dashboard") && !isEventDashboard

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      active: pathname === "/dashboard/analytics",
    },
    {
      title: "My Events",
      href: "/my-events",
      icon: Calendar,
      active: pathname === "/my-events",
    },
    {
      title: "Create Event",
      href: "/create-event",
      icon: PlusCircle,
      active: pathname === "/create-event",
    },
    {
      title: "Attendees",
      href: "/dashboard/attendees",
      icon: Users,
      active: pathname === "/dashboard/attendees",
    },
    {
      title: "Templates",
      href: "/dashboard/events/templates",
      icon: FileText,
      active: pathname === "/dashboard/events/templates",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  const eventNavItems = eventId
    ? [
        {
          title: "Overview",
          href: `/event-dashboard/${eventId}`,
          icon: Home,
          active: pathname === `/event-dashboard/${eventId}`,
        },
        {
          title: "Edit Event",
          href: `/event-dashboard/${eventId}/edit`,
          icon: Settings,
          active: pathname === `/event-dashboard/${eventId}/edit`,
        },
        {
          title: "Attendees",
          href: `/event-dashboard/${eventId}/attendees`,
          icon: Users,
          active: pathname === `/event-dashboard/${eventId}/attendees`,
        },
        {
          title: "Customize Attendee Form",
          href: `/event-dashboard/${eventId}/attendees/customize`,
          icon: CheckSquare,
          active: pathname === `/event-dashboard/${eventId}/attendees/customize`,
        },
        {
          title: "Volunteers",
          href: `/event-dashboard/${eventId}/volunteers`,
          icon: Users,
          active: pathname === `/event-dashboard/${eventId}/volunteers`,
        },
        {
          title: "Customize Volunteer Form",
          href: `/event-dashboard/${eventId}/volunteers/customize`,
          icon: CheckSquare,
          active: pathname === `/event-dashboard/${eventId}/volunteers/customize`,
        },
        {
          title: "Speakers",
          href: `/event-dashboard/${eventId}/speakers`,
          icon: Users,
          active: pathname === `/event-dashboard/${eventId}/speakers`,
        },
        {
          title: "Customize Speaker Form",
          href: `/event-dashboard/${eventId}/speakers/customize`,
          icon: CheckSquare,
          active: pathname === `/event-dashboard/${eventId}/speakers/customize`,
        },
        {
          title: "Forms Management",
          href: `/event-dashboard/${eventId}/forms/customize`,
          icon: FormInput,
          active: pathname === `/event-dashboard/${eventId}/forms/customize`,
        },
      ]
    : []

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            {isEventDashboard ? "Event Dashboard" : "Main Dashboard"}
          </h2>
          <div className="space-y-1">
            {isEventDashboard
              ? eventNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      item.active ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                ))
              : mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                      item.active ? "bg-accent text-accent-foreground" : "transparent",
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}
