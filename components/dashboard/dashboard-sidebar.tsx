"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  ChevronDown,
  ChevronRight,
  Menu,
  Star,
  Mail,
  Palette,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = session?.user?.role || "user"

  // State to track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    events: true, // Events section expanded by default
  })

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const userNavItems = [
    {
      title: "Dashboard",
      href: "/user-dashboard",
      icon: LayoutDashboard,
    },
    {
      section: "events",
      title: "Events",
      icon: Calendar,
      expanded: expandedSections.events,
      children: [
        { title: "My Events", href: "/my-events" },
        { title: "My Tickets", href: "/my-tickets" },
        { title: "Past Events", href: "/past-events" },
        { title: "Explore Events", href: "/explore" },
      ],
    },
    {
      title: "My Reviews",
      href: "/my-reviews",
      icon: Star,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const eventPlannerNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      section: "events",
      title: "Events",
      icon: Calendar,
      expanded: expandedSections.events,
      children: [
        { title: "My Events", href: "/my-events" },
        { title: "My Tickets", href: "/my-tickets" },
        { title: "Past Events", href: "/past-events" },
        { title: "Create Event", href: "/dashboard/events/create" },
        { title: "Explore Events", href: "/explore" },
      ],
    },
    {
      title: "Event Reviews",
      href: "/event-reviews",
      icon: Star,
    },
    {
      title: "Email Templates",
      href: "/settings/email-templates",
      icon: Mail,
    },
    {
      title: "Email Designs",
      href: "/settings/email-designs",
      icon: Palette,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const superAdminNavItems = [
    {
      title: "Dashboard",
      href: "/super-admin",
      icon: LayoutDashboard,
    },
    {
      section: "events",
      title: "Events",
      icon: Calendar,
      expanded: expandedSections.events,
      children: [
        { title: "All Events", href: "/super-admin/events" },
        { title: "My Tickets", href: "/my-tickets" },
        { title: "Past Events", href: "/past-events" },
        { title: "Explore Events", href: "/explore" },
        { title: "Categories", href: "/super-admin/events/categories" },
      ],
    },
    {
      title: "All Reviews",
      href: "/super-admin/reviews",
      icon: Star,
    },
    {
      title: "Email Templates",
      href: "/settings/email-templates",
      icon: Mail,
    },
    {
      title: "Email Designs",
      href: "/settings/email-designs",
      icon: Palette,
    },
    {
      title: "Users",
      href: "/super-admin/users",
      icon: Users,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  let navItems = userNavItems

  if (userRole === "event-planner") {
    navItems = eventPlannerNavItems
  } else if (userRole === "super-admin") {
    navItems = superAdminNavItems
  }

  // Mobile navigation component
  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
        <ScrollArea className="h-full py-6">
          <div className="flex flex-col gap-4 py-2">
            <div className="px-3 py-2">
              <div className="grid gap-1">
                {navItems.map((item, index) =>
                  item.children ? (
                    <div key={index} className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-3"
                        onClick={() => toggleSection(item.section)}
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </span>
                        {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>

                      {item.expanded && (
                        <div className="pl-6 space-y-1">
                          {item.children.map((child, childIndex) => (
                            <Button
                              key={childIndex}
                              variant="ghost"
                              asChild
                              className={cn(
                                "justify-start w-full px-3 py-1 h-8",
                                pathname === child.href && "bg-accent text-accent-foreground",
                              )}
                            >
                              <Link href={child.href}>{child.title}</Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      key={index}
                      variant="ghost"
                      asChild
                      className={cn(
                        "justify-start gap-2 px-3",
                        pathname === item.href && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Spacer to push logout button to bottom */}
            <div className="flex-1"></div>

            {/* Logout button */}
            <div className="px-3 py-2 mt-auto border-t border-border/50 pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <div className="block md:hidden absolute left-4 top-4 z-50">
        <MobileNav />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="flex w-[240px] flex-col gap-4 py-6">
            <div className="px-3 py-2">
              <div className="grid gap-1">
                {navItems.map((item, index) =>
                  item.children ? (
                    <div key={index} className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-3"
                        onClick={() => toggleSection(item.section)}
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </span>
                        {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>

                      {item.expanded && (
                        <div className="pl-6 space-y-1">
                          {item.children.map((child, childIndex) => (
                            <Button
                              key={childIndex}
                              variant="ghost"
                              asChild
                              className={cn(
                                "justify-start w-full px-3 py-1 h-8",
                                pathname === child.href && "bg-accent text-accent-foreground",
                              )}
                            >
                              <Link href={child.href}>{child.title}</Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      key={index}
                      variant="ghost"
                      asChild
                      className={cn(
                        "justify-start gap-2 px-3",
                        pathname === item.href && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Spacer to push logout button to bottom */}
            <div className="flex-1"></div>

            {/* Logout button */}
            <div className="px-3 py-2 mt-auto border-t border-border/50 pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
