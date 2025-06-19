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
  History,
  QrCode,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { motion, AnimatePresence } from "framer-motion"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  // State to track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    events: true, // Events section expanded by default
  })

  // State to track if sidebar is collapsed (desktop only)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Add a new state to track the last clicked icon
  const [lastClickedIcon, setLastClickedIcon] = useState<string | null>(null)

  // Add a state to store the user role to prevent flickering
  const [userRole, setUserRole] = useState<string>("loading")

  const refreshUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        if (userData.role && userData.role !== userRole) {
          console.log("Updating user role from API:", userData.role)
          setUserRole(userData.role)
        }
      }
    } catch (error) {
      console.error("Error refreshing user role:", error)
    }
  }

  useEffect(() => {
    setMounted(true)

    // Only update the role when session is available and different from current
    if (status === "authenticated" && session?.user?.role) {
      console.log("Setting user role to:", session.user.role)
      setUserRole(session.user.role)
    } else if (status === "unauthenticated") {
      console.log("User is not authenticated")
      setUserRole("user") // Default to user if not authenticated
    }
  }, [session, status])

  // Call this function when the component mounts
  useEffect(() => {
    if (mounted && userRole !== "loading") {
      refreshUserRole()
    }
  }, [mounted, userRole])

  // Don't render anything until we're mounted and have determined the role
  if (!mounted || userRole === "loading") {
    return null
  }

  console.log("Rendering sidebar for user role:", userRole)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

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

  // Add this function after the handleLogout function
  const handleIconClick = (itemTitle: string) => {
    setLastClickedIcon(itemTitle)

    // Reset the animation after 2 seconds
    setTimeout(() => {
      setLastClickedIcon(null)
    }, 2000)
  }

  // Add this function after handleIconClick

  // Get submenu icon based on title
  const getSubmenuIcon = (title) => {
    switch (title) {
      case "Events":
        return BookMarked
      case "Event Tickets":
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
        { title: "Events", href: "/my-events", icon: BookMarked },
        { title: "Event Tickets", href: "/my-tickets", icon: Ticket },
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
        { title: "Create Event", href: "/dashboard/events/create", icon: PlusCircle },
        { title: "Events", href: "/my-events", icon: BookMarked },
        { title: "Event Tickets", href: "/my-tickets", icon: Ticket },
        { title: "Past Events", href: "/past-events", icon: Clock },
        { title: "Explore Events", href: "/explore", icon: Compass },
      ],
    },
    {
      title: "Web Check-in",
      href: "/event-check-in",
      icon: QrCode,
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
        // { title: "Categories", href: "/super-admin/events/categories", icon: Tag },
      ],
    },
    {
      title: "All Reviews",
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
    {
      href: "/settings/email-history",
      title: "Email History",
      icon: History,
    },
    // {
    //   href: "/settings/email-templates",
    //   label: "Email Templates",
    //   icon: Mail,
    // },
    // {
    //   href: "/settings/email-designs",
    //   label: "Email Designs",
    //   icon: Palette,
    // },
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
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#170f83] to-[#0aacf7]">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg text-white">Tech Milap</span>
            </Link>
          </div>

          {/* User info section - Moved to top */}
          <div className="p-4 border-b bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#c12b6b] to-[#fea91b] flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{session?.user?.name || "User"}</p>
                <p className="text-xs text-slate-500 capitalize">{userRole.replace("-", " ")}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-slate-200 text-slate-600 hover:text-[#c12b6b] hover:border-[#c12b6b]/20 hover:bg-[#c12b6b]/10 transition-colors mt-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) =>
                item.children ? (
                  <div key={index} className="space-y-1 mb-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 font-medium bg-slate-100/70 hover:bg-slate-200/70"
                      onClick={() => toggleSection(item.section)}
                    >
                      <span className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-[#170f83]" />
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
                                      ? "bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 text-[#170f83] font-medium"
                                      : "hover:bg-slate-100 hover:text-[#0aacf7]",
                                  )}
                                  onClick={() => handleIconClick(child.title)}
                                >
                                  <Link href={child.href} className="flex items-center gap-3">
                                    <motion.div
                                      animate={
                                        lastClickedIcon === child.title
                                          ? {
                                            y: [0, -5, 0, -5, 0, -3, 0],
                                            rotate: [0, -5, 5, -5, 5, -3, 0],
                                            transition: { duration: 2 },
                                          }
                                          : {}
                                      }
                                    >
                                      <IconComponent className="h-4 w-4" />
                                    </motion.div>
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
                        ? "bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 text-[#170f83]"
                        : "hover:bg-slate-100 hover:text-[#0aacf7]",
                    )}
                    onClick={() => handleIconClick(item.title)}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-[#170f83]" />
                      </div>
                      {item.title}
                    </Link>
                  </Button>
                ),
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {/* Mobile menu button in the header */}
      <div className="block md:hidden absolute left-4 top-4 z-50">
        <MobileNav />
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden border-r bg-white md:flex flex-col transition-all duration-300 shadow-sm",
          isCollapsed ? "w-[80px]" : "w-[280px]",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#170f83] to-[#0aacf7]">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg text-white">Event</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="h-8 w-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mx-auto">
              <Calendar className="h-5 w-5" />
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 hover:bg-white/10 text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-8 w-8 mx-auto hover:bg-white/10 text-white mt-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* User info section - Moved to top */}
        <div className="p-4 border-b bg-slate-50">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#c12b6b] to-[#fea91b] flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-slate-500 capitalize">{userRole.replace("-", " ")}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-slate-200 text-slate-600 hover:text-[#c12b6b] hover:border-[#c12b6b]/20 hover:bg-[#c12b6b]/10 transition-colors mt-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#c12b6b] to-[#fea91b] flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <Button
                variant="outline"
                className="w-10 h-10 p-0 border-slate-200 text-slate-600 hover:text-[#c12b6b] hover:border-[#c12b6b]/20 hover:bg-[#c12b6b]/10 transition-colors"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
                      "font-medium bg-slate-100/70 hover:bg-slate-200/70",
                      isCollapsed ? "justify-center h-14 w-14 mx-auto p-0 ml-1" : "justify-between px-3 w-full",
                    )}
                    onClick={() => !isCollapsed && toggleSection(item.section)}
                  >
                    <span className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                      <div
                        className={cn(
                          "rounded-md bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 flex items-center justify-center",
                          isCollapsed ? "h-10 w-10" : "h-8 w-8",
                        )}
                      >
                        <item.icon className="h-4 w-4 text-[#170f83]" />
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
                                    ? "bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 text-[#170f83] font-medium"
                                    : "hover:bg-slate-100 hover:text-[#0aacf7]",
                                )}
                                onClick={() => handleIconClick(child.title)}
                              >
                                <Link href={child.href} className="flex items-center gap-3">
                                  <motion.div
                                    animate={
                                      lastClickedIcon === child.title
                                        ? {
                                          y: [0, -5, 0, -5, 0, -3, 0],
                                          rotate: [0, -5, 5, -5, 5, -3, 0],
                                          transition: { duration: 2 },
                                        }
                                        : {}
                                    }
                                  >
                                    <IconComponent className="h-4 w-4" />
                                  </motion.div>
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
                      ? "bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 text-[#170f83]"
                      : "hover:bg-slate-100 hover:text-[#0aacf7]",
                  )}
                  title={isCollapsed ? item.title : undefined}
                  onClick={() => handleIconClick(item.title)}
                >
                  <Link href={item.href} className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    <motion.div
                      className={cn(
                        "rounded-md bg-gradient-to-r from-[#170f83]/10 to-[#0aacf7]/10 flex items-center justify-center",
                        isCollapsed ? "h-10 w-10" : "h-8 w-8",
                      )}
                      animate={
                        lastClickedIcon === item.title
                          ? {
                            y: [0, -5, 0, -5, 0, -3, 0],
                            rotate: [0, -5, 5, -5, 5, -3, 0],
                            transition: { duration: 2 },
                          }
                          : {}
                      }
                    >
                      <item.icon className="h-4 w-4 text-[#170f83]" />
                    </motion.div>
                    {!isCollapsed && item.title}
                  </Link>
                </Button>
              ),
            )}
            {/* {userRole === "super-admin" && (
              <div className="mt-4 px-2">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={refreshUserRole}>
                  Debug: Refresh Role ({userRole})
                </Button>
              </div>
            )} */}
          </div>
        </ScrollArea>
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
