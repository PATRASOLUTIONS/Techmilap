"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

interface EmailDesignPreviewProps {
  designId: string
}

export function EmailDesignPreview({ designId }: EmailDesignPreviewProps) {
  const [activeTab, setActiveTab] = useState("success")

  const getDesignTemplate = (content: string, recipientName = "John Doe") => {
    switch (designId) {
      case "modern":
        return `
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Tech Milap</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #6b7280; font-size: 16px; margin-top: 0;">Hello ${recipientName},</p>
              <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </div>
            <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; text-align: center;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech Milap. All rights reserved.</p>
              <p style="margin: 8px 0 0;">
                <a href="#" style="color: #4f46e5; text-decoration: none;">Unsubscribe</a> | 
                <a href="#" style="color: #4f46e5; text-decoration: none;">View in browser</a>
              </p>
            </div>
          </div>
        `
      case "elegant":
        return `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 30px; background-color: #fcfcfc; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="color: #1f2937; font-size: 28px; font-weight: normal; margin: 0;">Tech Milap</h1>
            </div>
            <p style="color: #4b5563; font-size: 17px; margin-top: 0;">Dear ${recipientName},</p>
            <div style="color: #1f2937; font-size: 17px; line-height: 1.7;">
              ${content}
            </div>
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 15px; text-align: center;">
              <p style="margin: 0;">With warm regards,<br>The Tech Milap Team</p>
              <p style="margin: 20px 0 0;">© ${new Date().getFullYear()} Tech Milap</p>
            </div>
          </div>
        `
      case "colorful":
        return `
          <div style="font-family: 'Verdana', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f0f9ff; border-radius: 12px; overflow: hidden; border: 2px solid #bfdbfe;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 600;">Tech Milap</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #4b5563; font-size: 16px; font-weight: bold; margin-top: 0;">Hi ${recipientName}!</p>
              <div style="color: #1f2937; font-size: 16px; line-height: 1.6; background-color: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);">
                ${content}
              </div>
            </div>
            <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 14px; background-color: rgba(255, 255, 255, 0.7);">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech Milap | <a href="#" style="color: #4f46e5; text-decoration: none;">Unsubscribe</a></p>
              <div style="margin-top: 15px;">
                <a href="#" style="display: inline-block; margin: 0 5px;"><img src="/facebook-icon.png" alt="Facebook" style="width: 24px; height: 24px;"></a>
                <a href="#" style="display: inline-block; margin: 0 5px;"><img src="/twitter-icon.png" alt="Twitter" style="width: 24px; height: 24px;"></a>
                <a href="#" style="display: inline-block; margin: 0 5px;"><img src="/linkedin-icon.png" alt="LinkedIn" style="width: 24px; height: 24px;"></a>
              </div>
            </div>
          </div>
        `
      case "minimal":
        return `
          <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 30px; background-color: #ffffff;">
            <div style="margin-bottom: 30px;">
              <h1 style="color: #111827; font-size: 22px; font-weight: 500; margin: 0;">Tech Milap</h1>
            </div>
            <p style="color: #374151; font-size: 16px; margin-top: 0;">Hello ${recipientName},</p>
            <div style="color: #1f2937; font-size: 16px; line-height: 1.6;">
              ${content}
            </div>
            <div style="margin-top: 40px; color: #9ca3af; font-size: 14px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech Milap</p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                This email was sent to you because you registered for an event on Tech Milap.
                <br>
                <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `
      case "corporate":
        return `
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e5e7eb;">
            <div style="background-color: #1e293b; padding: 25px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Tech Milap</h1>
            </div>
            <div style="padding: 30px;">
              <p style="color: #475569; font-size: 16px; margin-top: 0;">Hello ${recipientName},</p>
              <div style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
            </div>
            <div style="padding: 20px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align: left; vertical-align: middle;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Tech Milap</p>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <p style="margin: 0;">
                      <a href="#" style="color: #64748b; text-decoration: none; margin-left: 10px;">Privacy Policy</a>
                      <a href="#" style="color: #64748b; text-decoration: none; margin-left: 10px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        `
      default:
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="margin-top: 0;">Hello ${recipientName},</p>
            <div>
              ${content}
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Tech Milap. All rights reserved.</p>
            </div>
          </div>
        `
    }
  }

  const getSuccessEmailContent = () => {
    return `
      <p>We're delighted to confirm your registration for <strong>Tech Conference 2023</strong>!</p>
      
      <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #4f46e5; background-color: #f3f4f6;">
        <h3 style="margin-top: 0; margin-bottom: 10px;">Event Details:</h3>
        <p style="margin: 0 0 5px;"><strong>Date:</strong> October 15, 2023</p>
        <p style="margin: 0 0 5px;"><strong>Time:</strong> 10:00 AM - 4:00 PM</p>
        <p style="margin: 0 0 5px;"><strong>Location:</strong> Convention Center, New York</p>
        <p style="margin: 0;"><strong>Ticket ID:</strong> TECH-2023-12345</p>
      </div>
      
      <p>Please save this email for your records. You'll need your Ticket ID to check in at the event.</p>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Your Ticket</a>
      </div>
      
      <p>We look forward to seeing you at the event!</p>
      
      <p>Best regards,<br>The Tech Milap Team</p>
    `
  }

  const getRejectionEmailContent = () => {
    return `
      <p>Thank you for your interest in <strong>Tech Conference 2023</strong>.</p>
      
      <p>After careful consideration of all applications, we regret to inform you that we are unable to confirm your registration at this time.</p>
      
      <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #ef4444; background-color: #fef2f2;">
        <h3 style="margin-top: 0; margin-bottom: 10px; color: #b91c1c;">Why was my registration not confirmed?</h3>
        <p style="margin: 0;">This is often due to reaching our venue capacity limit. We encourage you to apply early for our future events.</p>
      </div>
      
      <p>We appreciate your understanding and hope to see you at one of our upcoming events.</p>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">View Upcoming Events</a>
      </div>
      
      <p>Best regards,<br>The Tech Milap Team</p>
    `
  }

  const getTicketEmailContent = () => {
    return `
      <p>Here is your ticket for <strong>Tech Conference 2023</strong>. Please present this ticket (printed or digital) at the event entrance.</p>
      
      <div style="margin: 25px 0; border: 2px dashed #d1d5db; padding: 20px; background-color: #f9fafb; text-align: center;">
        <h2 style="margin-top: 0; color: #111827;">ADMISSION TICKET</h2>
        <h3 style="margin-bottom: 20px; color: #4f46e5;">Tech Conference 2023</h3>
        
        <div style="margin: 15px 0; padding: 10px; background-color: white; border: 1px solid #e5e7eb;">
          <img src="/qr-code.png" alt="QR Code" style="width: 100px; height: 100px;">
          <p style="margin: 10px 0 0; font-family: monospace; font-size: 14px;">TECH-2023-12345</p>
        </div>
        
        <div style="text-align: left; margin-top: 20px;">
          <p style="margin: 5px 0;"><strong>Attendee:</strong> John Doe</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> October 15, 2023</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> 10:00 AM - 4:00 PM</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> Convention Center, New York</p>
          <p style="margin: 5px 0;"><strong>Ticket Type:</strong> General Admission</p>
        </div>
      </div>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">Download Ticket</a>
      </div>
      
      <h3>Important Information:</h3>
      <ul>
        <li>Please arrive 30 minutes before the event starts for check-in</li>
        <li>Bring a valid photo ID for verification</li>
        <li>The venue has limited parking, so public transportation is recommended</li>
      </ul>
      
      <p>We look forward to seeing you at the event!</p>
    `
  }

  const getCertificateEmailContent = () => {
    return `
      <p>Congratulations on completing <strong>Tech Conference 2023</strong>! We're pleased to present you with your certificate of participation.</p>
      
      <div style="margin: 25px 0; border: 5px solid #d1d5db; padding: 25px; background-color: #f9fafb; text-align: center;">
        <h2 style="margin-top: 0; color: #111827; font-size: 24px;">CERTIFICATE OF PARTICIPATION</h2>
        
        <p style="margin: 20px 0; font-size: 16px;">This certifies that</p>
        <h3 style="margin: 10px 0; color: #4f46e5; font-size: 22px;">John Doe</h3>
        <p style="margin: 20px 0; font-size: 16px;">has successfully participated in</p>
        <h3 style="margin: 10px 0; color: #111827; font-size: 20px;">Tech Conference 2023</h3>
        <p style="margin: 20px 0; font-size: 16px;">held on October 15, 2023</p>
        
        <div style="margin-top: 30px;">
          <img src="/handwritten-signature.png" alt="Signature" style="width: 150px; height: 50px;">
          <p style="margin: 5px 0 0; font-size: 14px;">Event Director</p>
        </div>
      </div>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">Download Certificate</a>
      </div>
      
      <p>Thank you for being part of our event. We hope you found it valuable and look forward to seeing you at future events!</p>
    `
  }

  const getContentForTab = (tab: string) => {
    switch (tab) {
      case "success":
        return getDesignTemplate(getSuccessEmailContent())
      case "rejection":
        return getDesignTemplate(getRejectionEmailContent())
      case "ticket":
        return getDesignTemplate(getTicketEmailContent())
      case "certificate":
        return getDesignTemplate(getCertificateEmailContent())
      default:
        return getDesignTemplate(getSuccessEmailContent())
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="rejection">Rejection</TabsTrigger>
          <TabsTrigger value="ticket">Ticket</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
        </TabsList>
        <TabsContent value="success" className="mt-4">
          <Card className="overflow-hidden">
            <div className="bg-white p-4 rounded-md border">
              <div className="max-h-[500px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: getContentForTab("success") }} />
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="rejection" className="mt-4">
          <Card className="overflow-hidden">
            <div className="bg-white p-4 rounded-md border">
              <div className="max-h-[500px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: getContentForTab("rejection") }} />
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="ticket" className="mt-4">
          <Card className="overflow-hidden">
            <div className="bg-white p-4 rounded-md border">
              <div className="max-h-[500px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: getContentForTab("ticket") }} />
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="certificate" className="mt-4">
          <Card className="overflow-hidden">
            <div className="bg-white p-4 rounded-md border">
              <div className="max-h-[500px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: getContentForTab("certificate") }} />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        <p>
          This is a preview of how your emails will appear. The actual email may look slightly different depending on
          the recipient's email client.
        </p>
      </div>
    </div>
  )
}
