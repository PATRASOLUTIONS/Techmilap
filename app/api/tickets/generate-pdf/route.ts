import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import PDFDocument from "pdfkit"
import type PDFKit from "pdfkit"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { ticketId, ticketType, formType } = data

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    let ticketData

    if (ticketType === "submission") {
      // Get form submission data
      const submission = await db.collection("formSubmissions").findOne({
        _id: ticketId,
        userId: session.user.id,
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      // Get event data
      const event = await db.collection("events").findOne({
        _id: submission.eventId,
      })

      ticketData = {
        ...submission,
        event,
        formType: formType || submission.formType,
      }
    } else {
      // Get regular ticket data
      const ticket = await db.collection("tickets").findOne({
        _id: ticketId,
        userId: session.user.id,
      })

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      // Get event data
      const event = await db.collection("events").findOne({
        _id: ticket.eventId,
      })

      ticketData = {
        ...ticket,
        event,
      }
    }

    // Create a PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 })

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="ticket-${ticketId.substring(0, 6)}.pdf"`)

    // Buffer to store PDF data
    const chunks: Buffer[] = []

    // Collect PDF data
    doc.on("data", (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    // Generate PDF content
    generateTicketPDF(doc, ticketData)

    // Finalize the PDF
    doc.end()

    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        const result = Buffer.concat(chunks)
        resolve(result)
      })
    })

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}

// Function to generate ticket PDF content
function generateTicketPDF(doc: PDFKit.PDFDocument, ticketData: any) {
  const isFormSubmission = !!ticketData.formData
  const event = ticketData.event || {}

  // Format date
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date not available"

  // Format time
  const eventTime = event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : "Time not specified"

  // Get ticket type
  const ticketType = isFormSubmission ? ticketData.formType || "attendee" : ticketData.ticketType || "attendee"

  // Get person name and email
  let personName = "Guest"
  let personEmail = "Not provided"

  if (isFormSubmission && ticketData.formData) {
    // Try to extract name from form data
    personName =
      ticketData.formData.name ||
      ticketData.formData.fullName ||
      ticketData.formData.firstName ||
      ticketData.formData["question_name"] ||
      "Guest"

    // Try to extract email from form data
    const emailKeys = Object.keys(ticketData.formData).filter(
      (key) => key === "email" || key === "emailAddress" || key.includes("email") || key.includes("Email"),
    )
    personEmail = emailKeys.length > 0 ? ticketData.formData[emailKeys[0]] : "Not provided"
  } else {
    personName = ticketData.userName || "Guest"
    personEmail = ticketData.userEmail || "Not provided"
  }

  // Add event title
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(event.title || "Event Ticket", { align: "center" })

  // Add ticket type
  doc
    .moveDown(0.5)
    .fontSize(16)
    .font("Helvetica")
    .fillColor("#666")
    .text(`${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)} Pass`, { align: "center" })

  // Add horizontal line
  doc
    .moveDown(1)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke("#cccccc")

  // Add event details section
  doc.moveDown(1).fontSize(14).font("Helvetica-Bold").fillColor("#000").text("Event Details")

  doc.moveDown(0.5).fontSize(12).font("Helvetica").text(`Date: ${eventDate}`)

  doc.moveDown(0.5).text(`Time: ${eventTime}`)

  if (event.location) {
    doc.moveDown(0.5).text(`Location: ${event.location}`)
  }

  if (event.venue) {
    doc.moveDown(0.5).text(`Venue: ${event.venue}`)
  }

  // Add ticket details section
  doc.moveDown(1.5).fontSize(14).font("Helvetica-Bold").text("Ticket Information")

  doc
    .moveDown(0.5)
    .fontSize(12)
    .font("Helvetica")
    .text(`Ticket #: ${isFormSubmission ? ticketData._id.substring(0, 6) : ticketData.ticketNumber}`)

  doc.moveDown(0.5).text(`Status: Confirmed`)

  // Add attendee information section
  doc.moveDown(1.5).fontSize(14).font("Helvetica-Bold").text("Attendee Information")

  doc.moveDown(0.5).fontSize(12).font("Helvetica").text(`Name: ${personName}`)

  doc.moveDown(0.5).text(`Email: ${personEmail}`)

  // Add additional form data if available
  if (isFormSubmission && ticketData.formData) {
    doc.moveDown(1.5).fontSize(14).font("Helvetica-Bold").text("Additional Information")

    doc.moveDown(0.5).fontSize(12).font("Helvetica")

    Object.entries(ticketData.formData)
      .filter(
        ([key]) =>
          key !== "name" &&
          key !== "email" &&
          !key.includes("Email") &&
          !key.includes("email") &&
          key !== "fullName" &&
          key !== "firstName" &&
          key !== "question_name",
      )
      .forEach(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^./, (str) => str.toUpperCase())

        doc.moveDown(0.5).text(`${formattedKey}: ${String(value)}`)
      })
  }

  // Add footer
  doc
    .moveDown(2)
    .fontSize(10)
    .fillColor("#999")
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" })

  doc.moveDown(0.5).text("Present this ticket at the event entrance", { align: "center" })
}
