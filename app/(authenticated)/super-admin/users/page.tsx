"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  UserCog,
  Filter,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Calendar,
  Mail,
  User,
  Shield,
  X
} from "lucide-react"

interface UserData {
  _id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role: string
  createdAt: string
  isVerified: boolean | null
  image?: string
}

export default function UsersManagementPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filtering and sorting state
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [searchInputValue, setSearchInputValue] = useState("") // For the input field
  const [activeSearchQuery, setActiveSearchQuery] = useState("") // For triggering fetch
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Check if user is super admin
  useEffect(() => {
    if (session && session.user.role !== "super-admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [session, router, toast])

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (activeSearchQuery) params.append("search", activeSearchQuery) // Add searchQuery to the API call
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      params.append("sort", sortDirection)

      console.log(params.toString())

      const response = await fetch(`/api/users?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log(data.users)
      setUsers(data.users)
      setTotalUsers(data.pagination.total)
      setTotalPages(data.pagination.pages)
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchUsers()
    }
  }, [page, limit, roleFilter, sortDirection, session, activeSearchQuery])

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearchQuery(searchInputValue)
  }

  // Export users as CSV
  const exportUsers = () => {
    // Convert users to CSV format
    const headers = ["Name", "Email", "Role", "Created At", "Verified"]
    const csvData = users.map((user) => [
      getFullName(user),
      user.email,
      user.role,
      new Date(user.createdAt).toLocaleDateString(),
      user.emailVerified ? "Yes" : "No",
    ])

    // Create CSV content
    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `Exported ${users.length} users to CSV`,
    })
  }

  // Get full name from user data
  const getFullName = (user: UserData): string => {
    // If name exists, return it
    if (user.name) return user.name

    // If firstName and lastName exist, combine them
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`

    // If only firstName exists
    if (user.firstName) return user.firstName

    // If only lastName exists
    if (user.lastName) return user.lastName

    // Fallback to email or Unknown
    return user.email ? user.email.split("@")[0] : "Unknown"
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super-admin":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "event-planner":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "user":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Render loading skeleton
  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserCog className="h-6 w-6" />
              User Management
            </CardTitle>
            <CardDescription>Manage all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="w-1/3">
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-40" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-24" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-60" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-20" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            User Management
          </CardTitle>
          <CardDescription>Manage all users in the system. Total users: {totalUsers}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters and search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <form onSubmit={handleSearch} className="flex w-full sm:w-1/3 gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-8 pr-8"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                  />
                  {searchInputValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => {
                        setSearchInputValue("");
                        setActiveSearchQuery("")
                        if (page !== 1) { // Reset to page 1 if not already there
                          setPage(1);
                        }
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </form>

              <div className="flex gap-2 items-center">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter by role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="event-planner">Event Planner</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={exportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>

                <Button variant="ghost" onClick={fetchUsers} title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error message */}
            {error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">{error}</div>}

            {/* Users table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">
                      <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("name")}>
                        <User className="h-4 w-4" />
                        Name
                        {sortField === "name" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-primary"
                        onClick={() => toggleSort("email")}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                        {sortField === "email" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("role")}>
                        <Shield className="h-4 w-4" />
                        Role
                        {sortField === "role" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-primary"
                        onClick={() => toggleSort("createdAt")}
                      >
                        <Calendar className="h-4 w-4" />
                        Created
                        {sortField === "createdAt" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {loading ? "Loading users..." : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{getFullName(user)}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          {user.isVerified ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {users.length} of {totalUsers} users
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show first page, last page, current page and pages around current
                    let pageNum = i + 1
                    if (totalPages > 5) {
                      if (page > 3 && page < totalPages - 1) {
                        pageNum = [1, page - 1, page, page + 1, totalPages][i]
                      } else if (page >= totalPages - 1) {
                        pageNum = [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages][i]
                      }
                    }

                    return (
                      <PaginationItem key={i}>
                        {pageNum === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink isActive={page === pageNum} onClick={() => setPage(pageNum)}>
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
