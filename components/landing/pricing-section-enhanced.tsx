"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/section-heading"
import Link from "next/link"

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [isAnnual, setIsAnnual] = useState(true)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  const plans = [
    {
      name: "Free",
      description: "For individuals and small events",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { name: "Up to 3 events", included: true },
        { name: "Basic event pages", included: true },
        { name: "Up to 100 attendees per event", included: true },
        { name: "Email notifications", included: true },
        { name: "Basic analytics", included: true },
        { name: "Community support", included: true },
        { name: "Custom branding", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Priority support", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "For professional event organizers",
      monthlyPrice: 29,
      annualPrice: 24,
      features: [
        { name: "Unlimited events", included: true },
        { name: "Custom event pages", included: true },
        { name: "Up to 500 attendees per event", included: true },
        { name: "Email notifications", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Custom branding", included: true },
        { name: "Ticketing & payments", included: true },
        { name: "API access", included: false },
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations and conferences",
      monthlyPrice: 99,
      annualPrice: 84,
      features: [
        { name: "Unlimited events", included: true },
        { name: "Custom event pages", included: true },
        { name: "Unlimited attendees", included: true },
        { name: "Email notifications", included: true },
        { name: "Advanced analytics", included: true },
        { name: "24/7 dedicated support", included: true },
        { name: "Custom branding", included: true },
        { name: "Ticketing & payments", included: true },
        { name: "API access", included: true },
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />

      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Simple, Transparent Pricing"
          subtitle="Choose the plan that's right for you"
          description="No hidden fees or complicated pricing structures. Just straightforward plans designed to scale with your needs."
        />

        <div className="flex justify-center mt-8 mb-12">
          <div className="bg-muted/50 p-1 rounded-full">
            <div className="relative flex">
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  !isAnnual ? "text-white" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  isAnnual ? "text-white" : "text-muted-foreground"
                }`}
              >
                Annual <span className="text-xs opacity-80">(Save 20%)</span>
              </button>
              <div
                className={`absolute top-1 left-1 w-1/2 h-[calc(100%-8px)] bg-gradient-to-r from-primary to-secondary rounded-full transition-transform duration-200 ${
                  isAnnual ? "translate-x-full" : ""
                }`}
              ></div>
            </div>
          </div>
        </div>

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={item}
              className={`relative flex flex-col h-full rounded-xl overflow-hidden border ${
                plan.popular ? "border-primary/30 shadow-lg shadow-primary/10" : "border-border/50 shadow-md"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-6 bg-background">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold">${isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-primary mt-1">Billed annually (${plan.annualPrice * 12}/year)</p>
                )}
                <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="block mt-6">
                  <Button
                    className={`w-full ${
                      plan.popular ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90" : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
              <div className="p-6 bg-muted/30 flex-grow">
                <h4 className="font-medium mb-4">What's included:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary shrink-0 mr-3" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mr-3" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <h3 className="text-xl font-bold mb-4">Need a custom solution?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            We offer tailored solutions for large organizations with specific requirements. Contact our sales team to
            discuss your needs.
          </p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
