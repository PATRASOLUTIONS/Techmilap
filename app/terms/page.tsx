import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Terms of Service | Tech Milap",
  description: "Terms of service for using the Tech Milap platform.",
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose max-w-none">
          <p className="text-lg mb-6">Last updated: April 20, 2025</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Tech Milap ("we," "our," or "us"). These Terms of Service govern your use of our website,
            mobile applications, and services (collectively, the "Services"). By accessing or using our Services, you
            agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use of Services</h2>
          <p>
            Our Services allow users to create, manage, and attend tech events. You may use our Services only as
            permitted by these Terms and any applicable laws or regulations.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Account Registration</h3>
          <p>
            To access certain features of our Services, you may need to register for an account. You agree to provide
            accurate, current, and complete information during the registration process and to update such information
            to keep it accurate, current, and complete.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Content</h2>
          <p>
            Our Services allow you to create, upload, and share content, including event descriptions, images, and
            comments ("User Content"). You retain ownership of your User Content, but you grant us a non-exclusive,
            royalty-free, worldwide license to use, display, and distribute your User Content in connection with our
            Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Use our Services for any illegal purpose or in violation of any laws or regulations</li>
            <li>
              Post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory,
              vulgar, obscene, or otherwise objectionable
            </li>
            <li>
              Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person
              or entity
            </li>
            <li>Interfere with or disrupt our Services or servers or networks connected to our Services</li>
            <li>Attempt to gain unauthorized access to our Services, user accounts, or computer systems</li>
            <li>Collect or store personal data about other users without their consent</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
          <p>
            Our Services and their contents, features, and functionality are owned by us or our licensors and are
            protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary
            rights laws.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Termination</h2>
          <p>
            We may terminate or suspend your access to our Services immediately, without prior notice or liability, for
            any reason, including if you breach these Terms. Upon termination, your right to use our Services will
            immediately cease.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
          <p>
            Our Services are provided "as is" and "as available" without any warranties of any kind, either express or
            implied. We do not warrant that our Services will be uninterrupted or error-free, that defects will be
            corrected, or that our Services or the servers that make them available are free of viruses or other harmful
            components.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or
            indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or
            use of or inability to access or use our Services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
          <p>
            We may revise these Terms from time to time. The most current version will always be posted on our website.
            By continuing to access or use our Services after revisions become effective, you agree to be bound by the
            revised Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p>
            Email: support@techmilap.com
            <br />
            Address: 123 Tech Street, San Francisco, CA 94105
          </p>
        </div>
      </div>
    </div>
  )
}
