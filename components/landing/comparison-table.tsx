"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X, Info } from "lucide-react"
import { SectionHeading } from "@/components/ui/section-heading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ComparisonTable() {
  const [activeTab, setActiveTab] = useState("features")

  const features = [
    {
      name: "Custom Registration Forms",
      description: "Create fully customizable registration forms with conditional logic",
      us: true,
      competitor1: true,
      competitor2: false,
      highlight: false,
    },
    {
      name: "Speaker Management",
      description: "Comprehensive tools for speaker applications, selection, and communication",
      us: true,
      competitor1: false,
      competitor2: true,
      highlight: true,
    },
    {
      name: "Volunteer Management",
      description: "Dedicated system for volunteer recruitment, scheduling, and coordination",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
    {
      name: "Real-time Analytics",
      description: "Comprehensive analytics dashboard with real-time data",
      us: true,
      competitor1: true,
      competitor2: false,
      highlight: false,
    },
    {
      name: "Check-in System",
      description: "Fast QR code-based check-in with offline support",
      us: true,
      competitor1: true,
      competitor2: true,
      highlight: false,
    },
    {
      name: "Custom Email Templates",
      description: "Fully customizable email templates for all communications",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
    {
      name: "Multi-language Support",
      description: "Support for multiple languages in forms and communications",
      us: true,
      competitor1: false,
      competitor2: true,
      highlight: false,
    },
    {
      name: "Tech-focused Features",
      description: "Features specifically designed for tech events and hackathons",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
  ]

  const pricing = [
    {
      name: "Free Tier",
      description: "Basic features for small events",
      us: true,
      competitor1: true,
      competitor2: false,
      highlight: false,
    },
    {
      name: "Transparent Pricing",
      description: "Clear pricing with no hidden fees",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
    {
      name: "Pay-per-event Option",
      description: "Option to pay only for events you organize",
      us: true,
      competitor1: false,
      competitor2: true,
      highlight: false,
    },
    {
      name: "No Attendee Fees",
      description: "No extra fees charged to attendees",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
    {
      name: "Unlimited Events (Pro Plan)",
      description: "Create unlimited events on professional plans",
      us: true,
      competitor1: true,
      competitor2: true,
      highlight: false,
    },
  ]

  const support = [
    {
      name: "24/7 Customer Support",
      description: "Round-the-clock support via chat, email, and phone",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
    {
      name: "Dedicated Account Manager",
      description: "Personal account manager for premium plans",
      us: true,
      competitor1: true,
      competitor2: false,
      highlight: false,
    },
    {
      name: "Comprehensive Documentation",
      description: "Detailed guides and documentation",
      us: true,
      competitor1: true,
      competitor2: true,
      highlight: false,
    },
    {
      name: "Video Tutorials",
      description: "Step-by-step video tutorials for all features",
      us: true,
      competitor1: false,
      competitor2: true,
      highlight: false,
    },
    {
      name: "Community Forum",
      description: "Active community forum for peer support",
      us: true,
      competitor1: false,
      competitor2: false,
      highlight: true,
    },
  ]

  const getDataForTab = () => {
    switch (activeTab) {
      case "features":
        return features
      case "pricing":
        return pricing
      case "support":
        return support
      default:
        return features
    }
  }

  return (
    <section id="comparison" className="py-20">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Why We're Better"
          subtitle="Platform Comparison"
          description="See how our platform stacks up against the competition. We've built a solution specifically for tech event organizers."
        />

        <div className="mt-12">
          <Tabs defaultValue="features" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>
            </div>

            {["features", "pricing", "support"].map((tab) => (
              <TabsContent key={tab} value={tab} className="w-full">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-4 text-left font-medium text-muted-foreground w-1/3">Feature</th>
                        <th className="p-4 text-center font-medium text-primary">
                          <span className="block text-lg font-bold">TechMilap</span>
                          <span className="text-sm font-normal">Our Platform</span>
                        </th>
                        <th className="p-4 text-center font-medium text-muted-foreground">
                          <span className="block text-lg">Competitor A</span>
                          <span className="text-sm font-normal">General Events Platform</span>
                        </th>
                        <th className="p-4 text-center font-medium text-muted-foreground">
                          <span className="block text-lg">Competitor B</span>
                          <span className="text-sm font-normal">Conference Software</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDataForTab().map((item, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          viewport={{ once: true }}
                          className={`border-b ${item.highlight ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-4">
                            <div className="flex items-start gap-2">
                              <span className="font-medium">{item.name}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p>{item.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {item.us ? (
                              <Check className="h-6 w-6 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {item.competitor1 ? (
                              <Check className="h-6 w-6 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {item.competitor2 ? (
                              <Check className="h-6 w-6 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-6 w-6 text-red-500 mx-auto" />
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 text-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Get Started for Free
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  )
}
