"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Filter, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { exportToCSV } from "@/lib/csv-export"

export default function AttendeesPage() {
  const { id } = useParams()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegistrations, setSelectedRegistrations] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await fetch(`/api/events/${id}/registrations`)
        if (!response.ok) {
          throw new Error("Failed to fetch registrations")
        }
        const data = await response.json()
        setRegistrations(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching registrations:", error)
        toast({
          title: "Error",
          description: "Failed to load attendees. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [id, toast])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRegistrations(registrations.map((reg) => reg._id))
    } else {
      setSelectedRegistrations([])
    }
  }

  const handleSelect = (regId) => {
    if (selectedRegistrations.includes(regId)) {
      setSelectedRegistrations(selectedRegistrations.filter((id) => id !== regId))
    } else {
      setSelectedRegistrations([...selectedRegistrations, regId])
    }
  }

  const handleExportCSV = () => {
    try {
      // Extract relevant data for CSV
      const dataToExport = registrations.map((reg) => {
        const formData = reg.formData || {}
        return {
          Name: formData.name || formData.firstName + " " + formData.lastName || "N/A",
          Email: formData.email || "N/A",
          "Corporate Email": formData.corporateEmail || "N/A",
          Designation: formData.designation || "N/A",
          "LinkedIn ID": formData.linkedinId || "N/A",
          "GitHub ID": formData.githubId || "N/A",
          "Other Social Media": formData.otherSocialMediaId || "N/A",
          "Mobile Number": formData.mobileNumber || "N/A",
          Status: reg.status || "N/A",
          "Registration Date": new Date(reg.createdAt).toLocaleString() || "N/A",
        }
      })

      exportToCSV(dataToExport, `event-${id}-attendees`)
      toast({
        title: "Success",
        description: "Attendees data exported successfully",
      })
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Helper function to extract form data safely
  const getFormValue = (registration, field) => {
    if (!registration || !registration.formData) return "N/A"

    // Try different possible field names based on the form structure
    const formData = registration.formData

    switch (field) {
      case "name":
        return (
          formData.name ||
          (formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : null) ||
          "N/A"
        )
      case "email":
        return formData.email || "N/A"
      case "corporateEmail":
        return formData.corporateEmail || "N/A"
      case "designation":
        return formData.designation || "N/A"
      case "linkedinId":
        return formData.linkedinId || "N/A"
      case "githubId":
        return formData.githubId || "N/A"
      case "otherSocialMediaId":
        return formData.otherSocialMediaId || "N/A"
      case "mobileNumber":
        return formData.mobileNumber || "N/A"
      default:
        return "N/A"
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const searchFields = [
      reg.formData?.name,
      reg.formData?.email,
      reg.formData?.firstName,
      reg.formData?.lastName,
      reg.formData?.corporateEmail,
      reg.formData?.designation,
    ]

    return searchFields.some((field) => field && field.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Event Attendees</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Attendees</h1>
          <p className="text-gray-500">
            Manage your event attendees. Use filters to find specific attendees based on their registration information.
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-2">Filter Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Add filter options here */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full p-2 border rounded">
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border-b text-left">
                <Checkbox onChange={handleSelectAll} />
              </th>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Email ID</th>
              <th className="py-2 px-4 border-b text-left">Corporate Email ID</th>
              <th className="py-2 px-4 border-b text-left">Designation</th>
              <th className="py-2 px-4 border-b text-left">LinkedIn ID</th>
              <th className="py-2 px-4 border-b text-left">GitHub ID</th>
              <th className="py-2 px-4 border-b text-left">Other Social Media</th>
              <th className="py-2 px-4 border-b text-left">Mobile Number</th>
              <th className="py-2 px-4 border-b text-left">Registered</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-4 px-4 text-center text-gray-500">
                  No attendees found
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((registration) => (
                <tr key={registration._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <Checkbox
                      checked={selectedRegistrations.includes(registration._id)}
                      onChange={() => handleSelect(registration._id)}
                    />
                  </td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "name")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "email")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "corporateEmail")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "designation")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "linkedinId")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "githubId")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "otherSocialMediaId")}</td>
                  <td className="py-2 px-4 border-b">{getFormValue(registration, "mobileNumber")}</td>
                  <td className="py-2 px-4 border-b">
                    {registration.createdAt
                      ? `about ${Math.floor(
                          (Date.now() - new Date(registration.createdAt).getTime()) / (1000 * 60 * 60),
                        )} hours ago`
                      : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        registration.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : registration.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {registration.status
                        ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1)
                        : "Pending"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/event-dashboard/${id}/attendees/${registration._id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
