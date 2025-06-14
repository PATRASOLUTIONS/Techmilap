import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "GDPR Compliance | Tech Milap",
  description: "GDPR compliance information for the Tech Milap platform.",
}

export default function GDPRCompliancePage() {
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
        <h1 className="text-3xl font-bold mb-8">GDPR Compliance</h1>

        <div className="prose max-w-none">
          <p className="text-lg mb-6">Last updated: April 20, 2025</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            At Tech Milap, we are committed to protecting the privacy and security of your personal data. This
            GDPR Compliance Statement explains how we comply with the General Data Protection Regulation (GDPR) when
            processing personal data of individuals in the European Economic Area (EEA).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Data Controller</h2>
          <p>
            Tech Milap acts as a data controller for the personal data we collect and process. As a data
            controller, we determine the purposes and means of processing personal data.
          </p>
          <p>Our contact details are:</p>
          <p>
            Tech Milap
            <br />
            123 Tech Street
            <br />
            San Francisco, CA 94105
            <br />
            Email: privacy@techmilap.com
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Protection Officer</h2>
          <p>
            We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions in relation to
            this GDPR Compliance Statement and our privacy practices. If you have any questions about this statement or
            how we handle your personal data, please contact our DPO at:
          </p>
          <p>
            Email: dpo@techmilap.com
            <br />
            Address: 123 Tech Street, San Francisco, CA 94105
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Lawful Basis for Processing</h2>
          <p>
            Under the GDPR, we must have a lawful basis for processing your personal data. We process personal data on
            the following lawful bases:
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Consent</h3>
          <p>
            We process certain personal data based on your explicit consent, such as when you opt-in to receive
            marketing communications or when you provide special categories of personal data.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Contractual Necessity</h3>
          <p>
            We process personal data that is necessary for the performance of a contract to which you are a party, such
            as when you register for an event or create an account on our platform.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Legitimate Interests</h3>
          <p>
            We process personal data based on our legitimate interests, such as improving our services, preventing
            fraud, and ensuring the security of our platform. We always balance our interests against your rights and
            freedoms.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Legal Obligation</h3>
          <p>
            We process personal data to comply with legal obligations to which we are subject, such as tax laws,
            accounting requirements, and other regulatory obligations.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights Under GDPR</h2>
          <p>Under the GDPR, you have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>
              <strong>Right to Access:</strong> You have the right to request a copy of the personal data we hold about
              you.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You have the right to request that we correct any inaccurate or
              incomplete personal data.
            </li>
            <li>
              <strong>Right to Erasure:</strong> You have the right to request that we delete your personal data in
              certain circumstances.
            </li>
            <li>
              <strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the
              processing of your personal data in certain circumstances.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You have the right to request that we transfer your personal
              data to another organization or directly to you.
            </li>
            <li>
              <strong>Right to Object:</strong> You have the right to object to the processing of your personal data in
              certain circumstances.
            </li>
            <li>
              <strong>Rights Related to Automated Decision Making:</strong> You have the right not to be subject to a
              decision based solely on automated processing.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the information provided in the "Contact Us"
            section below.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational measures to ensure a level of security
            appropriate to the risk, including:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Encryption of personal data</li>
            <li>Regular testing and evaluation of technical and organizational measures</li>
            <li>Regular backups of personal data</li>
            <li>Staff training on data protection and security</li>
            <li>Access controls and authentication procedures</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. International Transfers</h2>
          <p>
            We may transfer your personal data to countries outside the EEA. When we do so, we ensure that appropriate
            safeguards are in place to protect your personal data, such as:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Standard contractual clauses approved by the European Commission</li>
            <li>Binding corporate rules</li>
            <li>Adequacy decisions by the European Commission</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Breach Notification</h2>
          <p>
            In the event of a personal data breach, we will notify the relevant supervisory authority without undue
            delay and, where feasible, not later than 72 hours after becoming aware of the breach, unless the breach is
            unlikely to result in a risk to your rights and freedoms.
          </p>
          <p>
            We will also notify you without undue delay if the breach is likely to result in a high risk to your rights
            and freedoms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Data Protection Impact Assessment</h2>
          <p>
            We conduct Data Protection Impact Assessments (DPIAs) for processing operations that are likely to result in
            a high risk to the rights and freedoms of individuals, particularly when using new technologies.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about our GDPR compliance or how we handle your personal data, please contact us
            at:
          </p>
          <p>
            Email: privacy@techmilap.com
            <br />
            Address: 123 Tech Street, San Francisco, CA 94105
          </p>
        </div>
      </div>
    </div>
  )
}
