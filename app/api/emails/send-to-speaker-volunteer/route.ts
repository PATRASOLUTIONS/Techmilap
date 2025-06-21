import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";
import Event from "@/models/Event";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, eventId } = await request.json();

    console.log("send-to-speaker API called with data:", { to, subject, content, eventId });

    if (!to || !subject || !content || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const event = await Event.findById(eventId).lean();

    let eventDetailsHtml = "";
    if (event && !Array.isArray(event)) {
      eventDetailsHtml = `
        <h3>Event Details:</h3>
        <p><strong>Title:</strong> ${event.title}</p>
        <p><strong>Date:</strong> ${event.date ? new Date(event.date).toLocaleDateString() : "TBA"}</p>
        <p><strong>Location:</strong> ${event.location || "TBA"}</p>
      `;
    }

    // Convert plain text content to HTML with line breaks and preserve paragraphs
    const contentLines = content.split(/\n+/).map((line: string) => line.trim());

    // Find index of "Best regards" or similar closing
    const closingIndex = contentLines.findIndex(line => /^best regards$/i.test(line));

    let openingContentLines: string[] = [];
    let closingContentLines: string[] = [];

    if (closingIndex !== -1) {
      openingContentLines = contentLines.slice(0, closingIndex);
      closingContentLines = contentLines.slice(closingIndex);
    } else {
      openingContentLines = contentLines;
    }

    const openingContentHtml = openingContentLines.map(line => `<p>${line}</p>`).join("");
    const closingContentHtml = closingContentLines.map(line => `<p>${line}</p>`).join("");

    const fullHtml = `
      <div>
        ${openingContentHtml}
        ${eventDetailsHtml}
        ${closingContentHtml}
      </div>
    `;

    // Construct plain text content with event details before closing
    let plainTextContent = openingContentLines.join("\n");
    if (event && !Array.isArray(event)) {
      plainTextContent += `

Event Details:
Title: ${event.title}
Date: ${event.date ? new Date(event.date).toLocaleDateString() : "TBA"}
Location: ${event.location || "TBA"}`;
    }
    if (closingContentLines.length > 0) {
      plainTextContent += `

${closingContentLines.join("\n")}`;
    }

    const emailSent = await sendEmail({
      to,
      subject,
      text: content,
      html: fullHtml,
    });

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in send-to-speaker API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
