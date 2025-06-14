import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/techmilap-logo-round.png"
                alt="Tech Milap Logo"
                width={50}
                height={50}
                className="object-contain"
              />
              <h3 className="font-bold text-lg text-[#170f83]">Tech Milap</h3>
            </div>
            <p className="text-black">
              Your all-in-one platform for planning, managing, and hosting successful tech events of any size.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#170f83]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-black hover:text-[#0aacf7]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-black hover:text-[#0aacf7]">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-black hover:text-[#0aacf7]">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-black hover:text-[#0aacf7]">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#170f83]">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-black hover:text-[#0aacf7]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/event-terms" className="text-black hover:text-[#0aacf7]">
                  Event Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-black hover:text-[#0aacf7]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-black hover:text-[#0aacf7]">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-black hover:text-[#0aacf7]">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#170f83]">Contact</h3>
            <address className="not-italic text-black">
              <p>Bengaluru, India</p>
              <p className="mt-2">
                <a href="tel:+918332936831" className="hover:text-[#0aacf7]">
                  +91 8332 936 831
                </a>
              </p>
              <p className="mt-2">
                <a href="mailto:info@techmilap.com" className="hover:text-[#0aacf7]">
                  info@techmilap.com
                </a>
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-black text-sm">
          <div className="flex justify-center mb-4">
            <Image src="/techmilap-logo.png" alt="Tech Milap" width={100} height={100} className="object-contain" />
          </div>
          <p>&copy; {new Date().getFullYear()} Tech Milap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
