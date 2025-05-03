"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
          button: "bg-blue-500 text-white px-6 py-2 rounded-md font-medium",
        }
      case "elegant":
        return {
          container: "bg-white font-serif",
          header: "bg-gray-800 text-white p-6 rounded-t-md",
          body: "p-8",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 italic rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-gray-800 text-white px-6 py-2 rounded-md font-medium",
        }
      case "colorful":
        return {
          container: "bg-white font-sans",
          header: "bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-md font-medium",
        }
      case "minimal":
        return {
          container: "bg-white font-sans",
          header: "border-b p-6 rounded-t-md",
          body: "p-8",
          footer: "border-t p-6 text-center text-sm text-gray-400 rounded-b-md",
          heading: "text-lg font-medium",
          text: "text-gray-600",
          button: "bg-black text-white px-6 py-2 rounded-md font-medium",
        }
      case "corporate":
        return {
          container: "bg-white font-sans",
          header: "bg-gray-700 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-200 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-blue-700 text-white px-6 py-2 rounded-md font-medium",
        }
      default:
        return {
          container: "bg-white font-sans",
          header: "bg-blue-500 text-white p-6 rounded-t-md",
          body: "p-6",
          footer: "bg-gray-100 p-6 text-center text-sm text-gray-600 rounded-b-md",
          heading: "text-xl font-bold",
          text: "text-gray-700",
          button: "bg-blue-500 text-white px-6 py-2 rounded-md font-medium",
        }
    }
  }

  const styles = getDesignStyles()

  const renderSuccessEmail = () => (
    <div className={`border rounded-md overflow-hidden ${styles.container}`}>
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
          <ul className={`list-disc pl-5 ${styles.text}`}>
            <li>Date: October 15, 2023</li>
            <li>Time: 10:00 AM - 4:00 PM</li>
            <li>Location: Convention Center, New York</li>
          </ul>
        </div>
        <div className="text-center my-6">
          <button className={styles.button}>View Ticket</button>
        </div>
        <p className={`mt-6 ${styles.text}`}>We look forward to seeing you there!</p>
        <p className={`mt-4 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>© 2023 Tech Events Inc. All rights reserved.</div>
    </div>
  )

  const renderRejectionEmail = () => (
    <div className={`border rounded-md overflow-hidden ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Registration Status Update</h2>
      </div>
      <div className={styles.body}>
        <p className={`mb-4 ${styles.text}`}>Dear John Doe,</p>
        <p className={`mb-4 ${styles.text}`}>
          Thank you for your interest in <strong>Tech Conference 2023</strong>.
        </p>
        <p className={`mb-4 ${styles.text}`}>
          We regret to inform you that we are unable to confirm your registration at this time.
        </p>
        <p className={`mb-4 ${styles.text}`}>Please contact us if you have any questions.</p>
        <p className={`mt-6 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>© 2023 Tech Events Inc. All rights reserved.</div>
    </div>
  )

  const renderTicketEmail = () => (
    <div className={`border rounded-md overflow-hidden ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Your Event Ticket</h2>
      </div>
      <div className={styles.body}>
        <p className={`mb-4 ${styles.text}`}>Dear John Doe,</p>
        <p className={`mb-4 ${styles.text}`}>
          Here is your ticket for <strong>Tech Conference 2023</strong>.
        </p>

        <div className="my-6 border-2 border-dashed border-gray-300 p-4 rounded-md">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold">Tech Conference 2023</h3>
          </div>
          <div className={`space-y-2 ${styles.text}`}>
            <p>
              <strong>Attendee:</strong> John Doe
            </p>
            <p>
              <strong>Ticket ID:</strong> TICKET-12345
            </p>
            <p>
              <strong>Date:</strong> October 15, 2023
            </p>
            <p>
              <strong>Time:</strong> 10:00 AM - 4:00 PM
            </p>
            <p>
              <strong>Location:</strong> Convention Center, New York
            </p>
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">Please present this ticket at the event entrance</div>
        </div>

        <p className={`mt-6 ${styles.text}`}>We look forward to seeing you there!</p>
        <p className={`mt-4 ${styles.text}`}>
          Best regards,
          <br />
          Tech Events Inc.
        </p>
      </div>
      <div className={styles.footer}>© 2023 Tech Events Inc. All rights reserved.</div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
        <CardDescription>Preview how your emails will look with this design</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="success">Success Email</TabsTrigger>
            <TabsTrigger value="rejection">Rejection Email</TabsTrigger>
            <TabsTrigger value="ticket">Ticket Email</TabsTrigger>
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
