"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Check, Shield, Zap, Users, Calendar, BarChart3, Palette, Clock, Award } from "lucide-react"

export function WhyChooseUsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  const reasons = [
    {
      icon: Zap,
      title: "All-in-One Solution",
      description:
        "Unlike other platforms that require multiple tools, we provide everything you need in one place - from registration to check-in.",
    },
    {
      icon: Shield,
      title: "Built for Tech Events",
      description:
        "Specifically designed for tech conferences, hackathons, and meetups with features tailored to tech community needs.",
    },
    {
      icon: Users,
      title: "Community-Focused",
      description:
        "Foster meaningful connections among attendees with our networking features that other platforms lack.",
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "Create complex multi-track schedules with ease, something generic event platforms struggle with.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Gain deeper insights into attendee behavior and event performance than any other platform.",
    },
    {
      icon: Palette,
      title: "Customizable Branding",
      description:
        "Maintain your brand identity with extensive customization options that generic platforms don't offer.",
    },
    {
      icon: Clock,
      title: "Time-Saving Automation",
      description: "Automate repetitive tasks like email reminders and certificate generation to save hours of work.",
    },
    {
      icon: Check,
      title: "Seamless Integration",
      description: "Easily connect with your existing tools and services, unlike closed ecosystems of other platforms.",
    },
    {
      icon: Award,
      title: "Dedicated Support",
      description:
        "Receive personalized assistance from a team that understands tech events, not generic customer service.",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Why Choose Our Platform"
          subtitle="The Smart Choice for Tech Event Organizers"
          description="Discover why leading tech companies and community organizers trust our platform over alternatives."
        />

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{
                y: -5,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                borderColor: "var(--primary)",
                transition: { duration: 0.3 },
              }}
              className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-0" />
              <motion.div
                variants={{
                  hidden: { scale: 0.5, opacity: 0 },
                  visible: {
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    },
                  },
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: [0, 5, -5, 0],
                  transition: {
                    duration: 0.5,
                  },
                }}
                className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 relative z-10"
              >
                <reason.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.h3
                className="text-xl font-semibold mb-2 relative z-10"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } },
                }}
              >
                {reason.title}
              </motion.h3>
              <motion.p
                className="text-muted-foreground relative z-10"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { delay: 0.3 } },
                }}
              >
                {reason.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-primary/10 text-primary font-medium px-6 py-3 rounded-full">
            Join over 500+ event organizers who have made the switch
          </div>
        </motion.div>
      </div>
    </section>
  )
}
