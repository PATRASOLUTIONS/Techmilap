import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Connect to database
    await connectToDatabase()

    // Import models after database connection is established
    const Ticket = (await import("@/models/Ticket")).default
    const FormSubmission = (await import("@/models/FormSubmission")).default
    const Event = (await import("@/models/Event")).default
    const User = (await import("@/models/User")).default

    // Get request body
    const { ticketId, ticketType, formType } = await req.json()

    // Get user email - this is the attendee's email
    const user = await User.findById(session.user.id)
    if (!user || !user.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 })
    }

    // This is the attendee's email
    const attendeeEmail = user.email

    console.log(`Sending ticket email to attendee: ${attendeeEmail}`)

    let ticketData
    let eventData

    // Get ticket data based on ticket type
    if (ticketType === "regular") {
      // Get regular ticket
      ticketData = await Ticket.findById(ticketId).lean()
      if (!ticketData) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      // Get event data
      eventData = await Event.findById(ticketData.event).lean()
    } else if (ticketType === "submission") {
      // Get form submission
      ticketData = await FormSubmission.findById(ticketId).lean()
      if (!ticketData) {
        return NextResponse.json({ error: "Form submission not found" }, { status: 404 })
      }

      // Get event data
      eventData = await Event.findById(ticketData.eventId).lean()
    } else {
      return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 })
    }

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Format date
    const formattedDate = eventData.date
      ? new Date(eventData.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date not available"

    // Format time
    const formattedTime =
      eventData.startTime && eventData.endTime ? `${eventData.startTime} - ${eventData.endTime}` : "Time not specified"

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `TICKET:${ticketId}:${ticketType === "regular" ? ticketData.ticketType : formType}:${
        ticketType === "regular" ? ticketData.eventId : ticketData.eventId
      }`,
    )}`

    // Create email content based on ticket type
    let emailHtml
    let emailSubject

    if (ticketType === "regular") {
      // Regular ticket email
      const ticketTypeDisplay = {
        attendee: "Attendee Pass",
        volunteer: "Volunteer Pass",
        speaker: "Speaker Pass",
      }[ticketData.ticketType]

      emailSubject = `Your Ticket for ${eventData.title}`
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="border: 2px dashed #6366f1; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative;">
            <!-- Ticket stub -->
            <div style="position: absolute; top: 0; bottom: 0; left: 0; width: 40px; background-color: #f0f7ff; border-right: 2px dashed #6366f1; text-align: center;">
              <div style="transform: rotate(90deg); transform-origin: left top; position: absolute; top: 50%; left: 20px; white-space: nowrap; font-weight: bold; color: #6366f1; font-size: 12px;">
                TICKET #${ticketData.ticketNumber.substring(0, 6)}
              </div>
            </div>
            
            <!-- Ticket content -->
            <div style="margin-left: 40px;">
              <!-- Header -->
              <div style="padding: 15px; background-color: white;">
                <h2 style="margin: 0; font-size: 20px;">${eventData.title}</h2>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                  <span style="color: #666;">${formattedDate}</span>
                  <span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${ticketTypeDisplay}</span>
                </div>
              </div>
              
              <!-- Details -->
              <div style="padding: 15px; border-top: 1px solid #e5e7eb;">
                <div style="margin-bottom: 10px; color: #666; font-size: 14px;">
                  <span style="display: inline-block; width: 16px; text-align: center; margin-right: 5px;">⏱️</span> ${formattedTime}
                </div>
                <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
                  <span style="display: inline-block; width: 16px; text-align: center; margin-right: 5px;">📍</span> ${
                    eventData.location || "Location not specified"
                  }
                </div>
                
                <!-- Ticket info -->
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4b5563;">Ticket Information</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
                    <div style="color: #6b7280;">Ticket Number</div>
                    <div style="text-align: right; font-weight: 500;">${ticketData.ticketNumber}</div>
                    
                    <div style="color: #6b7280;">Price</div>
                    <div style="text-align: right; font-weight: 500;">${
                      ticketData.price > 0 ? `$${ticketData.price.toFixed(2)}` : "Free"
                    }</div>
                    
                    <div style="color: #6b7280;">Status</div>
                    <div style="text-align: right; color: #10b981; font-weight: 500;">✓ Confirmed</div>
                  </div>
                </div>
                
                <!-- QR Code -->
                <div style="text-align: center; padding: 15px; border-top: 1px solid #e5e7eb;">
                  <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Present this QR code at the event</p>
                </div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
            <p>This is an automated email from Tech Milap. Please do not reply to this email.</p>
          </div>
        </div>
      `
    } else {
      // Form submission ticket email
      const roleType = formType || ticketData.formType || "attendee"
      const roleColors = {
        attendee: "#93c5fd",
        volunteer: "#86efac",
        speaker: "#c4b5fd",
      }

      // Extract name and email from form data
      const getName = () => {
        if (!ticketData.data) return user.name || "Attendee"
        return (
          ticketData.data.name ||
          ticketData.data.fullName ||
          ticketData.data.firstName ||
          ticketData.data["question_name"] ||
          user.name ||
          "Attendee"
        )
      }

      // Use the attendee's email from the session
      const getEmail = () => {
        return attendeeEmail
      }

      // Create form data HTML
      let formDataHtml = ""
      if (ticketData.data) {
        formDataHtml += `
          <div style="margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; font-size: 14px;">
              <div style="color: #6b7280;">Name:</div>
              <div>${getName()}</div>
              
              <div style="color: #6b7280;">Email:</div>
              <div>${getEmail()}</div>
            </div>
          </div>
        `

        // Add all other form data
        formDataHtml += `
          <div style="margin-top: 15px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563;">Additional Details:</h4>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; font-size: 14px;">
        `

        Object.entries(ticketData.data)
          .filter(([key]) => key !== "name" && key !== "email" && !key.includes("Email") && !key.includes("email"))
          .forEach(([key, value]) => {
            formDataHtml += `
              <div style="color: #6b7280;">${key.replace(/([A-Z])/g, " $1").trim()}:</div>
              <div>${String(value)}</div>
            `
          })

        formDataHtml += `
            </div>
          </div>
        `
      }

      emailSubject = `Your ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Pass for ${eventData.title}`
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="border: 2px dashed #6366f1; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative;">
            <!-- Ticket stub -->
            <div style="position: absolute; top: 0; bottom: 0; left: 0; width: 40px; background-color: #f0f7ff; border-right: 2px dashed #6366f1; text-align: center;">
              <div style="transform: rotate(90deg); transform-origin: left top; position: absolute; top: 50%; left: 20px; white-space: nowrap; font-weight: bold; color: #6366f1; font-size: 12px;">
                TICKET #${ticketId.substring(0, 6)}
              </div>
            </div>
            
            <!-- Ticket content -->
            <div style="margin-left: 40px;">
              <!-- Header -->
              <div style="padding: 15px; background-image: linear-gradient(to right, #6366f1, #8b5cf6); color: white;">
                <h2 style="margin: 0; font-size: 20px;">${eventData.title}</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">${formattedDate}</p>
                <div style="position: absolute; top: 15px; right: 15px;">
                  <span style="background-color: ${
                    roleColors[roleType as keyof typeof roleColors] || "#93c5fd"
                  }; color: #1e3a8a; padding: 3px 10px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                    ${roleType}
                  </span>
                </div>
              </div>
              
              <!-- Details -->
              <div style="padding: 15px;">
                <div style="margin-bottom: 10px; color: #666; font-size: 14px;">
                  <span style="display: inline-block; width: 16px; text-align: center; margin-right: 5px;">⏱️</span> ${formattedTime}
                </div>
                <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
                  <span style="display: inline-block; width: 16px; text-align: center; margin-right: 5px;">📍</span> ${
                    eventData.location || "Location not specified"
                  }
                </div>
                
                <!-- Application Details -->
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                  <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4b5563;">Application Details</h3>
                  ${formDataHtml}
                </div>
                
                <!-- QR Code -->
                <div style="text-align: center; padding: 15px; border-top: 1px solid #e5e7eb;">
                  <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">Present this QR code at the event</p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 10px 15px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 12px; color: #6b7280;">
                  Approved on ${new Date(ticketData.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
            <p>This is an automated email from Tech Milap. Please do not reply to this email.</p>
          </div>
        </div>
      `
    }

    // Send email to the attendee (the current user)
    console.log(`Sending email to attendee: ${attendeeEmail}`)
    const emailResult = await sendEmail({
      to: attendeeEmail, // Send to the attendee's email
      subject: emailSubject,
      text: `Your ticket for ${eventData.title}`,
      html: emailHtml,
    })

    if (!emailResult) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      recipient: attendeeEmail,
    })
  } catch (error: any) {
    console.error("Error sending ticket email:", error)
    return NextResponse.json({ error: `Failed to send ticket email: ${error.message}` }, { status: 500 })
  }
}
