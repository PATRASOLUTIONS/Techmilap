"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

export default function DebugEmailTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Check for authentication and admin role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "super-admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [status, session, router, toast])

  // Show loading state while checking session
  if (status === "loading" || status === "unauthenticated" || session?.user?.role !== "super-admin") {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Checking permissions</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug Email Templates</h1>
        <p className="text-muted-foreground mt-2">
          Super admin tools for managing and debugging email templates across users.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Template Explorer</h2>
          <TemplateExplorer />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Create Default Templates</h2>
          <DefaultTemplateCreator />
        </div>
      </div>
    </div>
  )
}

function TemplateExplorer() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [templateType, setTemplateType] = useState("")
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    }
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      let url = "/api/debug/email-templates"
      const params = new URLSearchParams()

      if (selectedUser) params.append("userId", selectedUser)
      if (templateType) params.append("templateType", templateType)

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch templates")

      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Template Type</label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="rejection">Rejection</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={fetchTemplates} disabled={loading}>
            {loading ? "Loading..." : "Fetch Templates"}
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-medium">Templates ({templates.length})</h3>
        </div>

        {templates.length > 0 ? (
          <div className="divide-y">
            {templates.map((template) => (
              <div key={template._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{template.templateName}</h4>
                  {template.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Type:</strong> {template.templateType}
                    </p>
                    <p>
                      <strong>Design:</strong> {template.designTemplate}
                    </p>
                    <p>
                      <strong>Subject:</strong> {template.subject}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Created:</strong> {new Date(template.createdAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>Updated:</strong> {new Date(template.updatedAt).toLocaleString()}
                    </p>
                    <p>
                      <strong>ID:</strong> {template._id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {loading ? "Loading templates..." : "No templates found. Use the filters above to search."}
          </div>
        )}
      </div>
    </div>
  )
}

function DefaultTemplateCreator() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState("")
  const [templateType, setTemplateType] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    }
  }

  const createDefaultTemplates = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/debug/email-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          templateType: templateType || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create templates")
      }

      const data = await response.json()
      setResult(data.results)

      toast({
        title: "Success",
        description: "Default templates created successfully",
      })
    } catch (error: any) {
      console.error("Error creating templates:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Template Type (Optional)</label>
          <Select value={templateType} onValueChange={setTemplateType}>
            <SelectTrigger>
              <SelectValue placeholder="All template types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="rejection">Rejection</SelectItem>
              <SelectItem value="ticket">Ticket</SelectItem>
              <SelectItem value="certificate">Certificate</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={createDefaultTemplates} disabled={loading}>
            {loading ? "Creating..." : "Create Default Templates"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Results</h3>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
