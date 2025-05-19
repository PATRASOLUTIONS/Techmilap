import type { Metadata } from "next"
import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"
import { ContactForm } from "@/components/contact/contact-form"
import { DecorativeBlob } from "@/components/ui/decorative-blob"

export const metadata: Metadata = {
  title: "Contact Us | TechEventPlanner",
  description:
    "Get in touch with TechEventPlanner. We'd love to hear from you and help with your event planning needs.",
}

export default function ContactPage() {
  return (
    <div className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <DecorativeBlob className="absolute right-0 top-0 -z-10 text-primary/10" />

      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help. Reach out to our team using any of the methods below.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-16 md:grid-cols-5 md:gap-x-12">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Our Location
              </h2>
              <address className="not-italic text-muted-foreground">
                Bengaluru
                <br />
                Karnataka
                <br />
                India
              </address>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Us
              </h2>
              <a href="mailto:info@techmilap.com" className="text-primary hover:underline">
                info@techmilap.com
              </a>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Call Us
              </h2>
              <p className="text-muted-foreground">
                <a href="tel:+918332936831" className="text-primary hover:underline">
                  +91 8332936831
                </a>
              </p>
            </div>

            <div className="py-4">
              <div className="relative h-64 w-full overflow-hidden rounded-lg">
                <Image src="/contemporary-city-center.png" alt="Office Location Map" fill className="object-cover" />
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-lg p-8 shadow-sm border">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
