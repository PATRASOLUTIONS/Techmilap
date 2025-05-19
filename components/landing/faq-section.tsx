"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FaqSection() {
  const faqs = [
    {
      question: "How is TechMilap different from other event platforms?",
      answer:
        "TechMilap is specifically designed for tech events with features like specialized registration forms, speaker management, volunteer coordination, and tech-focused analytics. Unlike general event platforms, we understand the unique needs of hackathons, tech conferences, and developer meetups.",
    },
    {
      question: "Can I try TechMilap before committing to a paid plan?",
      answer:
        "We offer a free tier that lets you create and manage a basic event with up to 100 attendees. This gives you a chance to explore our core features before upgrading to a paid plan for additional capabilities and larger events.",
    },
    {
      question: "Do you charge fees per ticket or registration?",
      answer:
        "No, we don't charge per-attendee fees. Our pricing is transparent and based on the plan you choose, not the number of registrations you receive. This makes budgeting simpler and more predictable for event organizers.",
    },
    {
      question: "Can I customize the registration process for my event?",
      answer:
        "Yes, our platform offers fully customizable registration forms with conditional logic, custom fields, and multi-page options. You can create different registration paths based on ticket types, collect specific information from different attendee groups, and design the entire process to match your event's branding.",
    },
    {
      question: "How does the check-in system work?",
      answer:
        "Our check-in system uses QR codes that can be scanned using our mobile app or web interface. The system works offline, syncs when connectivity is restored, and provides real-time check-in statistics. You can also enable self-check-in options for contactless event entry.",
    },
    {
      question: "Can I manage speakers and call for papers through your platform?",
      answer:
        "Yes, our platform includes comprehensive speaker management tools. You can create custom application forms, review submissions, communicate with speakers, collect their materials, and publish speaker profiles on your event website. The entire process from call for papers to final presentations can be managed within TechMilap.",
    },
    {
      question: "Do you support multiple languages for international events?",
      answer:
        "Yes, our platform supports multiple languages for registration forms, emails, and attendee communications. You can create bilingual or multilingual events and allow attendees to select their preferred language.",
    },
    {
      question: "What kind of analytics and reporting do you offer?",
      answer:
        "Our analytics dashboard provides real-time data on registrations, ticket sales, attendee demographics, session popularity, and more. You can create custom reports, export data in various formats, and integrate with tools like Google Analytics for additional insights.",
    },
    {
      question: "Can I integrate TechMilap with other tools we use?",
      answer:
        "Yes, we offer integrations with popular tools including Slack, Zoom, Google Workspace, Microsoft Teams, Mailchimp, HubSpot, and many payment processors. We also provide an API for custom integrations with your existing systems.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer 24/7 customer support via chat, email, and phone. Our premium plans include a dedicated account manager to help with event setup and optimization. We also provide comprehensive documentation, video tutorials, and an active community forum.",
    },
  ]

  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleAccordionChange = (value: string) => {
    setExpandedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Frequently Asked Questions"
          subtitle="Got Questions?"
          description="Find answers to common questions about our platform and how it can help you organize successful tech events."
        />

        <div className="mt-12 max-w-3xl mx-auto">
          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <AccordionItem value={`item-${i}`} className="border rounded-lg bg-background shadow-sm">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-1">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6">Still have questions? We're here to help.</p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <a href="/contact">
              Contact Us <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
