import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Cookie Policy | TechEventPlanner",
  description: "Cookie policy for the TechEventPlanner platform.",
}

export default function CookiePolicyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>

        <div className="prose max-w-none">
          <p className="text-lg mb-6">Last updated: April 20, 2025</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            This Cookie Policy explains how TechEventPlanner ("we," "our," or "us") uses cookies and similar
            technologies to recognize you when you visit our website and use our services (collectively, the
            "Services"). It explains what these technologies are and why we use them, as well as your rights to control
            our use of them.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. What Are Cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website.
            Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well
            as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, TechEventPlanner) are called "first-party cookies." Cookies
            set by parties other than the website owner are called "third-party cookies." Third-party cookies enable
            third-party features or functionality to be provided on or through the website (e.g., advertising,
            interactive content, and analytics).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function and cannot be switched off in our systems. They are
            usually only set in response to actions made by you which amount to a request for services, such as setting
            your privacy preferences, logging in, or filling in forms. You can set your browser to block or alert you
            about these cookies, but some parts of the site will not then work.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Performance Cookies</h3>
          <p>
            These cookies allow us to count visits and traffic sources so we can measure and improve the performance of
            our site. They help us to know which pages are the most and least popular and see how visitors move around
            the site. All information these cookies collect is aggregated and therefore anonymous.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Functionality Cookies</h3>
          <p>
            These cookies enable the website to provide enhanced functionality and personalization. They may be set by
            us or by third-party providers whose services we have added to our pages. If you do not allow these cookies,
            then some or all of these services may not function properly.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Targeting Cookies</h3>
          <p>
            These cookies may be set through our site by our advertising partners. They may be used by those companies
            to build a profile of your interests and show you relevant advertisements on other sites. They do not store
            directly personal information but are based on uniquely identifying your browser and internet device.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>To authenticate users and prevent fraudulent use of user accounts</li>
            <li>To remember information about your preferences and choices</li>
            <li>To understand and save user's preferences for future visits</li>
            <li>To keep track of advertisements</li>
            <li>To compile aggregate data about site traffic and site interactions</li>
            <li>To improve our website and provide a better user experience</li>
            <li>To track user's movement through the website</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Choices Regarding Cookies</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences
            by clicking on the appropriate opt-out links provided in the cookie banner or by changing your browser
            settings.
          </p>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the
            ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be
            personalized to you. It may also stop you from saving customized settings like login information.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Other Tracking Technologies</h2>
          <p>
            Cookies are not the only way to recognize or track visitors to a website. We may use other, similar
            technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These
            are tiny graphics files that contain a unique identifier that enable us to recognize when someone has
            visited our website or opened an email that we have sent them.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies
            we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy
            regularly to stay informed about our use of cookies and related technologies.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
          <p>If you have any questions about our use of cookies or other technologies, please contact us at:</p>
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
