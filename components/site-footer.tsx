import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">TechEventPlanner</h3>
            <p className="text-gray-600">
              Your all-in-one platform for planning, managing, and hosting successful tech events of any size.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/public-events" className="text-gray-600 hover:text-gray-900">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-600 hover:text-gray-900">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-gray-900">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-gray-600 hover:text-gray-900">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <address className="not-italic text-gray-600">
              <p>123 Tech Street</p>
              <p>San Francisco, CA 94105</p>
              <p className="mt-2">
                <a href="mailto:info@techeventplanner.com" className="hover:text-gray-900">
                  info@techeventplanner.com
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} TechEventPlanner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
