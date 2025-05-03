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
  Ticket,
  Clock,
  PlusCircle,
  Compass,
  BookMarked,
  ListChecks,
  Tag,
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

  // Theme state
  const [theme, setTheme] = useState({
    primary: "hsl(222.2, 47.4%, 11.2%)",
    secondary: "hsl(210, 40%, 96.1%)",
    accent: "hsl(262.1, 83.3%, 57.8%)",
    muted: "hsl(210, 40%, 96.1%)",
  })

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

  // Get submenu icon based on title
  const getSubmenuIcon = (title) => {
    switch (title) {
      case "My Events":
        return BookMarked
      case "My Tickets":
        return Ticket
      case "Past Events":
        return Clock
      case "Create Event":
        return PlusCircle
      case "Explore Events":
        return Compass
      case "All Events":
        return ListChecks
      case "Categories":
        return Tag
      default:
        return ChevronRight
    }
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
        { title: "My Events", href: "/my-events", icon: BookMarked },
        { title: "My Tickets", href: "/my-tickets", icon: Ticket },
        { title: "Past Events", href: "/past-events", icon: Clock },
        { title: "Explore Events", href: "/explore", icon: Compass },
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
        { title: "My Events", href: "/my-events", icon: BookMarked },
        { title: "My Tickets", href: "/my-tickets", icon: Ticket },
        { title: "Past Events", href: "/past-events", icon: Clock },
        { title: "Create Event", href: "/dashboard/events/create", icon: PlusCircle },
        { title: "Explore Events", href: "/explore", icon: Compass },
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
        { title: "All Events", href: "/super-admin/events", icon: ListChecks },
        { title: "My Tickets", href: "/my-tickets", icon: Ticket },
        { title: "Past Events", href: "/past-events", icon: Clock },
        { title: "Explore Events", href: "/explore", icon: Compass },
        { title: "Categories", href: "/super-admin/events/categories", icon: Tag },
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
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">MyEvent</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) =>
                item.children ? (
                  <div key={index} className="space-y-1 mb-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 font-medium bg-muted/50 hover:bg-muted"
                      onClick={() => toggleSection(item.section)}
                    >
                      <span className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-purple-700" />
                        </div>
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
                          <div className="pl-11 space-y-1 pt-1 pb-2">
                            {item.children.map((child, childIndex) => {
                              const IconComponent = child.icon || getSubmenuIcon(child.title)
                              return (
                                <Button
                                  key={childIndex}
                                  variant="ghost"
                                  asChild
                                  className={cn(
                                    "justify-start w-full px-3 py-1.5 h-9 font-normal",
                                    pathname === child.href
                                      ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 font-medium"
                                      : "hover:bg-muted/70 hover:text-purple-600",
                                  )}
                                >
                                  <Link href={child.href} className="flex items-center gap-3">
                                    <IconComponent className="h-4 w-4" />
                                    {child.title}
                                  </Link>
                                </Button>
                              )
                            })}
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
                      "justify-start gap-3 px-3 font-medium mb-1",
                      pathname === item.href
                        ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700"
                        : "hover:bg-muted hover:text-purple-600",
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-purple-700" />
                      </div>
                      {item.title}
                    </Link>
                  </Button>
                ),
              )}
            </div>
          </ScrollArea>

          {/* User info and logout */}
          <div className="border-t p-4 mt-auto bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole.replace("-", " ")}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
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
          "hidden border-r bg-gradient-to-b from-background to-background/95 md:flex flex-col transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[280px]",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">MyEvent</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mx-auto">
              <Calendar className="h-5 w-5" />
            </div>
          )}
          {!isCollapsed && (
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="h-8 w-8 hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-8 w-8 mx-auto hover:bg-muted mt-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1 py-4">
          <div className="flex flex-col gap-1 px-2">
            {navItems.map((item, index) =>
              item.children ? (
                <div key={index} className="space-y-1 mb-1">
                  <Button
                    variant="ghost"
                    className={cn(
                      "font-medium bg-muted/50 hover:bg-muted",
                      isCollapsed ? "justify-center px-0" : "justify-between px-3 w-full",
                    )}
                    onClick={() => !isCollapsed && toggleSection(item.section)}
                  >
                    <span className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <div
                        className={cn(
                          "rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center",
                          isCollapsed ? "h-10 w-10" : "h-8 w-8",
                        )}
                      >
                        <item.icon className="h-4 w-4 text-purple-700" />
                      </div>
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
                        <div className="pl-11 space-y-1 pt-1 pb-2">
                          {item.children.map((child, childIndex) => {
                            const IconComponent = child.icon || getSubmenuIcon(child.title)
                            return (
                              <Button
                                key={childIndex}
                                variant="ghost"
                                asChild
                                className={cn(
                                  "justify-start w-full px-3 py-1.5 h-9 font-normal",
                                  pathname === child.href
                                    ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 font-medium"
                                    : "hover:bg-muted/70 hover:text-purple-600",
                                )}
                              >
                                <Link href={child.href} className="flex items-center gap-3">
                                  <IconComponent className="h-4 w-4" />
                                  {child.title}
                                </Link>
                              </Button>
                            )
                          })}
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
                    "font-medium mb-1",
                    isCollapsed ? "justify-center h-14 w-14 mx-auto p-0" : "justify-start gap-3 px-3 w-full",
                    pathname === item.href
                      ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700"
                      : "hover:bg-muted hover:text-purple-600",
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Link href={item.href} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <div
                      className={cn(
                        "rounded-md bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center",
                        isCollapsed ? "h-10 w-10" : "h-8 w-8",
                      )}
                    >
                      <item.icon className="h-4 w-4 text-purple-700" />
                    </div>
                    {!isCollapsed && item.title}
                  </Link>
                </Button>
              ),
            )}
          </div>
        </ScrollArea>

        {/* User info and logout */}
        <div className="border-t p-4 mt-auto bg-muted/30">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole.replace("-", " ")}</p>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className={cn(
              isCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start gap-2",
              "text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors",
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
