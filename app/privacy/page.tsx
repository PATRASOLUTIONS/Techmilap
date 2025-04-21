import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | TechEventPlanner",
  description: "Privacy policy for the TechEventPlanner platform.",
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose max-w-none">
          <p className="text-lg mb-6">Last updated: April 20, 2025</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            TechEventPlanner ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our website, mobile
            applications, and services (collectively, the "Services").
          </p>
          <p>
            Please read this Privacy Policy carefully. By accessing or using our Services, you acknowledge that you have
            read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and
            practices, please do not use our Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
          <p>We may collect personal information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Contact information (such as name, email address, phone number)</li>
            <li>Account credentials (such as username and password)</li>
            <li>Profile information (such as profile picture, bio)</li>
            <li>Payment information (such as credit card details, billing address)</li>
            <li>Event information (such as event preferences, attendance history)</li>
            <li>Communications you send to us (such as customer support inquiries)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
          <p>When you access or use our Services, we may automatically collect information about you, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Log information (such as IP address, browser type, pages visited)</li>
            <li>Device information (such as device ID, operating system)</li>
            <li>Location information (such as general location based on IP address)</li>
            <li>Usage information (such as how you interact with our Services)</li>
            <li>Cookies and similar technologies (as described in our Cookie Policy)</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We may use the information we collect for various purposes, including to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Provide, maintain, and improve our Services</li>
            <li>Process transactions and send related information</li>
            <li>Send administrative messages, updates, and security alerts</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Personalize your experience and provide content and features</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and fraudulent activities</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Sharing of Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>With event organizers when you register for or attend their events</li>
            <li>With service providers who perform services on our behalf</li>
            <li>With business partners with whom we jointly offer products or services</li>
            <li>In connection with a business transaction (such as a merger or acquisition)</li>
            <li>When required by law or to protect our rights and safety</li>
            <li>With your consent or at your direction</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Retention</h2>
          <p>
            We will retain your information for as long as your account is active, as necessary to provide you with our
            Services, or as otherwise necessary to comply with our legal obligations, resolve disputes, and enforce our
            agreements.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Accessing, correcting, or deleting your personal information</li>
            <li>Objecting to or restricting certain processing of your information</li>
            <li>Requesting portability of your information</li>
            <li>Withdrawing consent for certain processing activities</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the "Contact Us" section
            below.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the
            Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Data Transfers</h2>
          <p>
            Your information may be transferred to, and processed in, countries other than the country in which you
            reside. These countries may have data protection laws that are different from the laws of your country. We
            take steps to ensure that your information receives an adequate level of protection in the countries in
            which we process it.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
          <p>
            Our Services are not intended for children under the age of 16. We do not knowingly collect personal
            information from children under 16. If we learn that we have collected personal information from a child
            under 16, we will take steps to delete such information as soon as possible.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be indicated by an updated
            "Last updated" date and will be effective as soon as it is accessible. We encourage you to review this
            Privacy Policy frequently to be informed of how we are protecting your information.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>
            Email: privacy@techeventplanner.com
            <br />
            Address: 123 Tech Street, San Francisco, CA 94105
          </p>
        </div>
      </div>
    </div>
  )
}
