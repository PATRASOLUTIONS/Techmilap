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
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = session?.user?.role || "user"

  // State to track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    events: true, // Events section expanded by default
  })

  // State to track if sidebar is collapsed (desktop only)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Toggle section expansion
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
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="font-semibold">MyEvent</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) =>
                item.children ? (
                  <div key={index} className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 font-medium"
                      onClick={() => toggleSection(item.section)}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-primary" />
                        {item.title}
                      </span>
                      <motion.div animate={{ rotate: item.expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </motion.div>
                    </Button>

                    <AnimatePresence>
                      {item.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-10 space-y-1 pt-1 pb-2">
                            {item.children.map((child, childIndex) => (
                              <Button
                                key={childIndex}
                                variant="ghost"
                                asChild
                                className={cn(
                                  "justify-start w-full px-3 py-1.5 h-9 font-normal",
                                  pathname === child.href && "bg-primary/10 text-primary font-medium",
                                )}
                              >
                                <Link href={child.href}>{child.title}</Link>
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Button
                    key={index}
                    variant="ghost"
                    asChild
                    className={cn(
                      "justify-start gap-3 px-3 font-medium",
                      pathname === item.href && "bg-primary/10 text-primary",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.title}
                    </Link>
                  </Button>
                ),
              )}
            </div>
          </ScrollArea>

          {/* User info and logout */}
          <div className="border-t p-4 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
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
      <div
        className={cn(
          "hidden border-r bg-background/95 backdrop-blur-sm md:flex flex-col transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[280px]",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="font-semibold">MyEvent</span>
            </Link>
          )}
          {isCollapsed && <Home className="h-5 w-5 mx-auto" />}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {isCollapsed && (
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="h-8 w-8 mx-auto">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 py-4">
          <div className="flex flex-col gap-1 px-2">
            {navItems.map((item, index) =>
              item.children ? (
                <div key={index} className="space-y-1">
                  <Button
                    variant="ghost"
                    className={cn("w-full font-medium", isCollapsed ? "justify-center px-0" : "justify-between px-3")}
                    onClick={() => !isCollapsed && toggleSection(item.section)}
                  >
                    <span className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <item.icon className="h-4 w-4 text-primary" />
                      {!isCollapsed && item.title}
                    </span>
                    {!isCollapsed && (
                      <motion.div animate={{ rotate: item.expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </motion.div>
                    )}
                  </Button>

                  <AnimatePresence>
                    {!isCollapsed && item.expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-10 space-y-1 pt-1 pb-2">
                          {item.children.map((child, childIndex) => (
                            <Button
                              key={childIndex}
                              variant="ghost"
                              asChild
                              className={cn(
                                "justify-start w-full px-3 py-1.5 h-9 font-normal",
                                pathname === child.href && "bg-primary/10 text-primary font-medium",
                              )}
                            >
                              <Link href={child.href}>{child.title}</Link>
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button
                  key={index}
                  variant="ghost"
                  asChild
                  className={cn(
                    "font-medium",
                    isCollapsed ? "justify-center h-10 w-10 mx-auto p-0" : "justify-start gap-3 px-3",
                    pathname === item.href && "bg-primary/10 text-primary",
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Link href={item.href} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <item.icon className="h-4 w-4 text-primary" />
                    {!isCollapsed && item.title}
                  </Link>
                </Button>
              ),
            )}
          </div>
        </ScrollArea>

        {/* User info and logout */}
        <div className="border-t p-4 mt-auto">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className={cn(
              isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start gap-2",
              "text-muted-foreground hover:text-destructive hover:border-destructive/30",
            )}
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </>
  )
}

// Add the ChevronLeft component that was missing
function ChevronLeft(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
