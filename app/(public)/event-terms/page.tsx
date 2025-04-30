import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Event Terms and Conditions | Tech Milap",
  description: "Standard terms and conditions for all Tech Milap events.",
}

export default function EventTermsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Event Terms and Conditions</h1>

        <div className="prose max-w-none">
          <p className="text-lg mb-6">Last updated: April 30, 2025</p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8">
            <p className="text-amber-700">
              These Terms and Conditions apply to all events organized, hosted, or managed through the Tech Milap
              platform. By registering for any event, you agree to be bound by these terms.
            </p>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Registration and Attendance</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Registration Confirmation</h3>
          <p>
            Your registration is not confirmed until you receive an official confirmation email from the event organizer
            or Tech Milap. Registration may be subject to approval by the event organizer.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Accurate Information</h3>
          <p>
            You agree to provide accurate, current, and complete information during the registration process. Providing
            false or misleading information may result in the cancellation of your registration without refund.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Identification</h3>
          <p>
            Event organizers may require you to present valid identification that matches your registration details to
            gain entry to the event.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">1.4 Transferability</h3>
          <p>
            Unless explicitly permitted by the event organizer, registrations are non-transferable. You may not sell,
            trade, or transfer your registration to another person without prior written consent from the event
            organizer.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cancellation and Refunds</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Attendee Cancellation</h3>
          <p>
            Cancellation policies vary by event. Please refer to the specific event details for the applicable
            cancellation policy. In general, refunds may be subject to processing fees or may not be available after
            certain deadlines.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Event Changes or Cancellation</h3>
          <p>
            The event organizer reserves the right to change the event program, speakers, venue, date, or cancel the
            event entirely due to circumstances beyond their control. In case of cancellation, the refund policy
            specified in the event details will apply.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Force Majeure</h3>
          <p>
            Neither Tech Milap nor the event organizer shall be liable for any failure to perform their obligations
            where such failure is a result of acts of nature, government restrictions, civil disturbances, or any other
            cause beyond their reasonable control.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Code of Conduct</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Expected Behavior</h3>
          <p>
            All attendees, speakers, sponsors, and volunteers are expected to behave in a respectful and professional
            manner. Harassment, discrimination, or disruptive behavior of any kind will not be tolerated.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Consequences</h3>
          <p>
            Event organizers reserve the right to refuse entry or remove any person from the event who does not comply
            with the code of conduct. No refund will be provided in such cases.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Reporting</h3>
          <p>
            If you experience or witness any violations of the code of conduct, please report it immediately to the
            event staff or contact info@techmilap.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Intellectual Property and Content</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Event Content</h3>
          <p>
            All content presented at the event, including but not limited to presentations, materials, and discussions,
            is the intellectual property of the respective speakers or content creators, unless otherwise stated.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Recording and Photography</h3>
          <p>
            By attending the event, you consent to being photographed, filmed, or recorded. These recordings may be used
            for promotional, educational, or documentation purposes by the event organizer or Tech Milap.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Content Sharing</h3>
          <p>
            Unless explicitly permitted, you may not record, reproduce, or share content from the event without prior
            written permission from the event organizer and the content creator.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Liability and Indemnification</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, Tech Milap and the event organizer shall not be liable for any
            direct, indirect, incidental, special, or consequential damages arising out of or in any way connected with
            attendance at or participation in the event.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Indemnification</h3>
          <p>
            You agree to indemnify and hold harmless Tech Milap, the event organizer, and their respective officers,
            directors, employees, and agents from any claims, losses, damages, liabilities, costs, and expenses arising
            from your attendance or participation in the event.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Personal Property</h3>
          <p>
            Tech Milap and the event organizer are not responsible for the loss, damage, or theft of any personal
            property brought to the event.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Privacy</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Data Collection</h3>
          <p>
            By registering for an event, you consent to the collection and processing of your personal information as
            described in our Privacy Policy. This information may be shared with the event organizer for event
            management purposes.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Communications</h3>
          <p>
            You may receive communications related to the event you registered for, including but not limited to
            confirmation emails, updates, and post-event surveys.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Miscellaneous</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Governing Law</h3>
          <p>
            These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without
            regard to its conflict of law provisions.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Severability</h3>
          <p>
            If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining
            provisions shall remain in full force and effect.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Amendments</h3>
          <p>
            Tech Milap reserves the right to amend these Terms and Conditions at any time. The most current version will
            always be posted on our website.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
          <p>If you have any questions about these Terms and Conditions, please contact us at:</p>
          <p className="mt-2">
            Email: info@techmilap.com
            <br />            
            Address: Bengaluru, India
          </p>
        </div>
      </div>
    </div>
  )
}
