import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { DecorativeBlob } from "@/components/ui/decorative-blob"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, HelpCircle, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Pricing | Tech Milap",
  description: "Choose the perfect pricing plan for your event management needs with Tech Milap.",
}

export default function PricingPage() {
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
        <LandingHeader />

        {/* Add padding to account for fixed header */}
        <div className="pt-24">
          <PricingSection />
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}

function PricingSection() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-24">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Choose the perfect plan for your event management needs
        </p>
      </div>

      {/* Pricing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-muted rounded-full p-1 flex">
          <Button variant="ghost" className="rounded-full px-6 bg-background shadow-sm">
            Monthly
          </Button>
          <Button variant="ghost" className="rounded-full px-6">
            Annual
          </Button>
        </div>
        <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
          Save 20%
        </Badge>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {/* Free Plan */}
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>For individuals and small events</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground ml-2">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingFeature included>Up to 2 events per month</PricingFeature>
            <PricingFeature included>50 attendees per event</PricingFeature>
            <PricingFeature included>Basic event page</PricingFeature>
            <PricingFeature included>Email notifications</PricingFeature>
            <PricingFeature included>Basic analytics</PricingFeature>
            <PricingFeature>Custom branding</PricingFeature>
            <PricingFeature>Ticket types & pricing</PricingFeature>
            <PricingFeature>Check-in app</PricingFeature>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/signup">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary/50 shadow-lg relative">
          <div className="absolute top-0 right-0 left-0">
            <Badge className="absolute top-0 right-6 transform -translate-y-1/2 bg-primary text-white">Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For growing organizations</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-muted-foreground ml-2">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingFeature included>Unlimited events</PricingFeature>
            <PricingFeature included>500 attendees per event</PricingFeature>
            <PricingFeature included>Custom event pages</PricingFeature>
            <PricingFeature included>Automated email campaigns</PricingFeature>
            <PricingFeature included>Advanced analytics</PricingFeature>
            <PricingFeature included>Custom branding</PricingFeature>
            <PricingFeature included>Multiple ticket types & pricing</PricingFeature>
            <PricingFeature included>Check-in app</PricingFeature>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/signup?plan=pro">Get Started</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>For large organizations & conferences</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$199</span>
              <span className="text-muted-foreground ml-2">/ month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PricingFeature included>Unlimited events</PricingFeature>
            <PricingFeature included>Unlimited attendees</PricingFeature>
            <PricingFeature included>Premium event pages</PricingFeature>
            <PricingFeature included>Advanced email campaigns</PricingFeature>
            <PricingFeature included>Real-time analytics & reporting</PricingFeature>
            <PricingFeature included>White-label experience</PricingFeature>
            <PricingFeature included>Advanced ticketing & seating</PricingFeature>
            <PricingFeature included>Multi-user access & permissions</PricingFeature>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Feature Comparison */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Compare Plans</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-medium">Features</th>
                <th className="text-center py-4 px-4 font-medium">Free</th>
                <th className="text-center py-4 px-4 font-medium">Pro</th>
                <th className="text-center py-4 px-4 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow feature="Events" free="2 per month" pro="Unlimited" enterprise="Unlimited" />
              <ComparisonRow feature="Attendees per event" free="50" pro="500" enterprise="Unlimited" />
              <ComparisonRow feature="Custom branding" free={false} pro={true} enterprise={true} />
              <ComparisonRow feature="Email campaigns" free="Basic" pro="Advanced" enterprise="Advanced" />
              <ComparisonRow feature="Analytics" free="Basic" pro="Advanced" enterprise="Real-time" />
              <ComparisonRow feature="Ticket types" free="1" pro="Multiple" enterprise="Advanced" />
              <ComparisonRow feature="Check-in app" free={false} pro={true} enterprise={true} />
              <ComparisonRow feature="API access" free={false} pro={false} enterprise={true} />
              <ComparisonRow feature="Priority support" free={false} pro="Email" enterprise="24/7 Phone & Email" />
              <ComparisonRow feature="Custom integrations" free={false} pro={false} enterprise={true} />
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FaqItem
            question="Can I upgrade or downgrade my plan at any time?"
            answer="Yes, you can upgrade your plan at any time and the new features will be immediately available. Downgrades take effect at the end of your current billing cycle."
          />
          <FaqItem
            question="Is there a contract or commitment?"
            answer="No, all our plans are month-to-month or annual with no long-term commitment. You can cancel at any time."
          />
          <FaqItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards, PayPal, and for Enterprise plans, we can also accommodate bank transfers and purchase orders."
          />
          <FaqItem
            question="Do you offer discounts for nonprofits or educational institutions?"
            answer="Yes, we offer special pricing for qualified nonprofits, educational institutions, and community organizations. Please contact our sales team for details."
          />
          <FaqItem
            question="What happens if I exceed my attendee limit?"
            answer="If you approach your attendee limit, we'll notify you so you can upgrade if needed. We won't cut off registrations mid-event."
          />
          <FaqItem
            question="Can I try before I buy?"
            answer="Our Free plan lets you explore the platform's core features. For Pro and Enterprise features, contact us for a personalized demo."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-muted/50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to elevate your events?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of event organizers who trust Tech Milap for their event management needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function PricingFeature({ children, included = false }) {
  return (
    <div className="flex items-start gap-2">
      {included ? (
        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      )}
      <span className={included ? "" : "text-muted-foreground"}>{children}</span>
    </div>
  )
}

function ComparisonRow({ feature, free, pro, enterprise }) {
  return (
    <tr className="border-b">
      <td className="py-4 px-4">{feature}</td>
      <td className="text-center py-4 px-4">
        {typeof free === "boolean" ? (
          free ? (
            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
          ) : (
            <X className="h-5 w-5 text-muted-foreground mx-auto" />
          )
        ) : (
          free
        )}
      </td>
      <td className="text-center py-4 px-4">
        {typeof pro === "boolean" ? (
          pro ? (
            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
          ) : (
            <X className="h-5 w-5 text-muted-foreground mx-auto" />
          )
        ) : (
          pro
        )}
      </td>
      <td className="text-center py-4 px-4">
        {typeof enterprise === "boolean" ? (
          enterprise ? (
            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
          ) : (
            <X className="h-5 w-5 text-muted-foreground mx-auto" />
          )
        ) : (
          enterprise
        )}
      </td>
    </tr>
  )
}

function FaqItem({ question, answer }) {
  return (
    <div>
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <h3 className="font-semibold">{question}</h3>
      </div>
      <p className="text-muted-foreground ml-7">{answer}</p>
    </div>
  )
}
