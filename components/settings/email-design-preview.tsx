"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface EmailDesignPreviewProps {
  designId: string
}

export function EmailDesignPreview({ designId }: EmailDesignPreviewProps) {
  const [activeTab, setActiveTab] = useState("success")

  const getDesignStyles = () => {
    switch (designId) {
      case "modern":
        return {
          container: "bg-white font-sans",
          header: "bg-blue-500 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium",
        }
      case "elegant":
        return {
          container: "bg-white font-serif",
          header: "bg-gray-800 text-white p-6 rounded-t-md",
          body: "p-8",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 italic rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-medium",
        }
      case "colorful":
        return {
          container: "bg-white font-sans",
          header: "bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button:
            "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs font-medium",
        }
      case "minimal":
        return {
          container: "bg-white font-sans",
          header: "border-b p-6 rounded-t-md",
          body: "p-8",
          footer: "border-t p-6 text-center text-sm text-gray-400 rounded-b-md",
          heading: "text-lg font-medium",
          text: "text-gray-600",
          button: "bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium",
        }
      case "corporate":
        return {
          container: "bg-white font-sans",
          header: "bg-gray-700 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-200 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium",
        }
      default:
        return {
          container: "bg-white font-sans",
          header: "bg-blue-500 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium inline-block no-underline",
          badge: "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium",
        }
    }
  }

  const styles = getDesignStyles()

  const renderSuccessEmail = () => (
    <div className={`border rounded-md overflow-hidden shadow-sm ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Registration Confirmed</h2>
      </div>
      <div className={styles.body}>
        <p className={`mb-4 ${styles.text}`}>Dear John Doe,</p>
        <p className={`mb-4 ${styles.text}`}>
          Your registration for <strong>Tech Conference 2023</strong> has been confirmed!
        </p>
        <div className="mb-6">
          <p className={`font-bold mb-2 ${styles.text}`}>Event Details:</p>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={styles.text}>Event Status:</span>
              <span className={styles.badge}>Confirmed</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={styles.text}>Date:</span>
              <span className={styles.text}>October 15, 2023</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={styles.text}>Time:</span>
              <span className={styles.text}>10:00 AM - 4:00 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={styles.text}>Location:</span>
              <span className={styles.text}>Convention Center, New York</span>
            </div>
          </div>
        </div>
        <div className="text-center my-6">
          <a href="#" className={styles.button}>
            View Ticket
          </a>
        </div>
        <p className={`mt-6 ${styles.text}`}>We look forward to seeing you there!</p>
        <p className={`mt-4 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>
        <div className="flex justify-center items-center gap-4 mb-2">
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
        <div>© 2023 Tech Events Inc. All rights reserved.</div>
        <div className="mt-2 text-xs text-gray-500">
          {/* <a href="#" className="text-gray-500 hover:underline">
            Unsubscribe
          </a>{" "}
          | */}
          <a href="#" className="text-gray-500 hover:underline ml-1">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )

  const renderRejectionEmail = () => (
    <div className={`border rounded-md overflow-hidden shadow-sm ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Registration Status Update</h2>
      </div>
      <div className={styles.body}>
        <p className={`mb-4 ${styles.text}`}>Dear John Doe,</p>
        <p className={`mb-4 ${styles.text}`}>
          Thank you for your interest in <strong>Tech Conference 2023</strong>.
        </p>
        <p className={`mb-4 ${styles.text}`}>
          We regret to inform you that we are unable to confirm your registration at this time due to limited capacity.
          Your application has been added to our waitlist, and we will contact you if a spot becomes available.
        </p>
        <div className="bg-gray-50 p-4 rounded-md my-6">
          <p className={`font-bold mb-2 ${styles.text}`}>Event Details:</p>
          <p className={`${styles.text} mb-1`}>
            <strong>Event:</strong> Tech Conference 2023
          </p>
          <p className={`${styles.text} mb-1`}>
            <strong>Date:</strong> October 15, 2023
          </p>
          <p className={`${styles.text}`}>
            <strong>Status:</strong> <span className="text-orange-500">Waitlisted</span>
          </p>
        </div>
        <div className="text-center my-6">
          <a href="#" className={styles.button}>
            View Other Events
          </a>
        </div>
        <p className={`mb-4 ${styles.text}`}>
          If you have any questions or need further assistance, please don't hesitate to contact our support team.
        </p>
        <p className={`mt-6 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>
        <div className="flex justify-center items-center gap-4 mb-2">
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
        <div>© 2023 Tech Events Inc. All rights reserved.</div>
        <div className="mt-2 text-xs text-gray-500">
          <a href="#" className="text-gray-500 hover:underline">
            Unsubscribe
          </a>{" "}
          |
          <a href="#" className="text-gray-500 hover:underline ml-1">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )

  const renderTicketEmail = () => (
    <div className={`border rounded-md overflow-hidden shadow-sm ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Your Event Ticket</h2>
      </div>
      <div className={styles.body}>
        <p className={`mb-4 ${styles.text}`}>Dear John Doe,</p>
        <p className={`mb-4 ${styles.text}`}>
          Here is your ticket for <strong>Tech Conference 2023</strong>. Please present this ticket at the event
          entrance.
        </p>

        <div className="my-6 border-2 border-dashed border-gray-300 p-4 rounded-md bg-gray-50">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">Tech Conference 2023</h3>
            <p className="text-sm text-gray-500">October 15, 2023 • 10:00 AM - 4:00 PM</p>
          </div>

          <div className="flex justify-center my-4">
            <div className="bg-white p-2 rounded border">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <rect width="150" height="150" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="black" />
                <rect x="30" y="10" width="10" height="10" fill="black" />
                <rect x="50" y="10" width="10" height="10" fill="black" />
                <rect x="70" y="10" width="10" height="10" fill="black" />
                <rect x="90" y="10" width="10" height="10" fill="black" />
                <rect x="110" y="10" width="10" height="10" fill="black" />
                <rect x="130" y="10" width="10" height="10" fill="black" />
                {/* More QR code elements would go here */}
              </svg>
            </div>
          </div>

          <div className={`space-y-2 ${styles.text}`}>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Attendee:</span>
              <span>John Doe</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Ticket ID:</span>
              <span>TICKET-12345</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Ticket Type:</span>
              <span>VIP Pass</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Location:</span>
              <span>Convention Center, New York</span>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">Please present this ticket at the event entrance</div>
        </div>

        <div className="text-center my-6">
          <a href="#" className={styles.button}>
            Download Ticket
          </a>
        </div>

        <p className={`mt-6 ${styles.text}`}>We look forward to seeing you there!</p>
        <p className={`mt-4 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>
        <div className="flex justify-center items-center gap-4 mb-2">
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
        <div>© 2023 Tech Events Inc. All rights reserved.</div>
        <div className="mt-2 text-xs text-gray-500">
          <a href="#" className="text-gray-500 hover:underline">
            Unsubscribe
          </a>{" "}
          |
          <a href="#" className="text-gray-500 hover:underline ml-1">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
        <CardDescription>See how your emails will appear to recipients with this design</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
  <TabsList
    className="
      w-full items-center h-12
      flex gap-2 overflow-x-auto whitespace-nowrap
      xl:grid xl:grid-cols-3 xl:overflow-visible xl:whitespace-normal
      scrollbar-hide
    "
  >                     <TabsTrigger value="success">
              <div className="flex items-center gap-2">
                <span>Confirmation</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Success
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="rejection">
              <div className="flex items-center gap-2">
                <span>Rejection</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Notice
                </Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="ticket">
              <div className="flex items-center gap-2">
                <span>Ticket</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Important
                </Badge>
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="success" className="space-y-4">
            {renderSuccessEmail()}
          </TabsContent>
          <TabsContent value="rejection" className="space-y-4">
            {renderRejectionEmail()}
          </TabsContent>
          <TabsContent value="ticket" className="space-y-4">
            {renderTicketEmail()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
