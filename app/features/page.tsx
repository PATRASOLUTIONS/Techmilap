import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { DecorativeBlob } from "@/components/ui/decorative-blob"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, BarChart3, Ticket, Mail, QrCode, Globe, Shield, Zap, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/landing/NavBar"

export const metadata = {
  title: "Features | Tech Milap",
  description: "Explore the powerful features of Tech Milap for successful event planning.",
}

export default function FeaturesPage() {
  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <DecorativeBlob
          className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] opacity-20 blur-3xl"
          color="var(--primary)"
        />
        <DecorativeBlob
          className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] opacity-10 blur-3xl"
          color="var(--secondary)"
        />
      </div>

      <div className="relative z-10">
        {/* Landing Header with Login/Register */}
        {/* <LandingHeader /> */}
        <Navbar/>

        {/* Add padding to account for fixed header */}
        <div className="pt-12">
          <FeaturesSection />
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-24">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Powerful Features for Seamless Events
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Everything you need to create, manage, and grow successful events in one platform
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        <FeatureCard
          icon={<Calendar className="h-10 w-10 text-primary" />}
          title="Event Creation & Management"
          description="Create and manage events with customizable registration forms, ticketing options, and detailed event pages."
        />
        <FeatureCard
          icon={<Users className="h-10 w-10 text-primary" />}
          title="Attendee Management"
          description="Track registrations, manage attendee information, and communicate with participants all in one place."
        />
        <FeatureCard
          icon={<BarChart3 className="h-10 w-10 text-primary" />}
          title="Analytics & Reporting"
          description="Gain insights with comprehensive analytics on attendance, engagement, and event performance."
        />
        <FeatureCard
          icon={<Ticket className="h-10 w-10 text-primary" />}
          title="Ticketing System"
          description="Create free or paid tickets with customizable pricing tiers and special offers for your events."
        />
        <FeatureCard
          icon={<Mail className="h-10 w-10 text-primary" />}
          title="Email Campaigns"
          description="Send personalized emails to attendees with event updates, reminders, and follow-ups."
        />
        <FeatureCard
          icon={<QrCode className="h-10 w-10 text-primary" />}
          title="Check-in System"
          description="Streamline the check-in process with QR code scanning and real-time attendance tracking."
        />
        <FeatureCard
          icon={<Globe className="h-10 w-10 text-primary" />}
          title="Multi-language Support"
          description="Reach a global audience with support for multiple languages and currencies."
        />
        <FeatureCard
          icon={<Shield className="h-10 w-10 text-primary" />}
          title="Security & Privacy"
          description="Keep your event data secure with advanced security features and GDPR compliance."
        />
        <FeatureCard
          icon={<Zap className="h-10 w-10 text-primary" />}
          title="Integration Ecosystem"
          description="Connect with your favorite tools through our extensive integration ecosystem."
        />
      </div>

      {/* Feature Showcase */}
      <div className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Designed for Event Success</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="order-2 lg:order-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Streamlined Event Creation</h3>
            <p className="text-muted-foreground mb-6">
              Our intuitive event creation process guides you through every step, from basic details to advanced
              customization options.
            </p>
            <ul className="space-y-3">
              {[
                "User-friendly interface with drag-and-drop functionality",
                "Customizable templates for quick setup",
                "Flexible form builder for registration",
                "Real-time preview of your event page",
                "SEO optimization tools for better visibility",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 relative aspect-video rounded-lg overflow-hidden shadow-xl">
            <Image src="/contemporary-city-center.png" alt="Event Creation Interface" fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
            <Image src="/bustling-tech-summit.png" alt="Attendee Management Dashboard" fill className="object-cover" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Powerful Attendee Management</h3>
            <p className="text-muted-foreground mb-6">
              Manage your event attendees with powerful tools designed to enhance the attendee experience from
              registration to post-event.
            </p>
            <ul className="space-y-3">
              {[
                "Comprehensive attendee profiles and data management",
                "Automated communication workflows",
                "Custom fields for gathering specific information",
                "Group registration and team management",
                "Attendee segmentation for targeted communications",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-muted/50 rounded-2xl p-8 md:p-12 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl italic mb-6">
            "Tech Milap has transformed how we manage our tech conferences. The platform is intuitive, powerful, and has
            helped us increase attendance by 40% while reducing administrative work by 60%."
          </p>
          <div className="flex items-center justify-center">
            <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
              <Image src="/confident-leader.png" alt="Sarah Johnson" fill className="object-cover" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Sarah Johnson</p>
              <p className="text-sm text-muted-foreground">Director of Events, TechConf Global</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Amazing Events?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of event organizers who trust Tech Milap for their event management needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
