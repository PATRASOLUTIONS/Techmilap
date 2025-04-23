"use client"

import { useRef } from "react"
import { motion, useInView, useAnimation } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import {
  Calendar,
  CreditCard,
  LineChart,
  Mail,
  QrCode,
  Settings,
  Ticket,
  Users,
  Code,
  Speaker,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react"
import { useEffect } from "react"

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

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

  const iconAnimation = {
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
    hover: {
      scale: 1.2,
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 0.5,
      },
    },
  }

  const features = [
    {
      icon: LayoutDashboard,
      title: "Intuitive Dashboard",
      description:
        "Manage all aspects of your event from a single, easy-to-use dashboard. Track registrations, manage speakers, and analyze performance metrics.",
    },
    {
      icon: Calendar,
      title: "Comprehensive Event Planning",
      description:
        "Create detailed event schedules, manage speakers, and customize registration forms to capture essential attendee information.",
    },
    {
      icon: Ticket,
      title: "Flexible Ticketing Options",
      description:
        "Offer a variety of ticket types, including early bird discounts, VIP packages, and group rates, to maximize revenue and attendance.",
    },
    {
      icon: Users,
      title: "Streamlined Attendee Management",
      description:
        "Simplify attendee check-in with QR codes, track attendance in real-time, and send automated reminders to keep everyone informed.",
    },
    {
      icon: Speaker,
      title: "Speaker & Sponsor Management",
      description:
        "Showcase speakers and sponsors with dedicated profiles, manage their sessions, and provide them with tools to engage with attendees.",
    },
    {
      icon: Mail,
      title: "Targeted Email Marketing",
      description:
        "Promote your event and keep attendees engaged with targeted email campaigns, automated reminders, and personalized communications.",
    },
    {
      icon: CreditCard,
      title: "Secure Payment Processing",
      description:
        "Accept payments securely with our integrated payment processing system, supporting multiple currencies and payment methods.",
    },
    {
      icon: QrCode,
      title: "Effortless QR Code Check-in",
      description:
        "Speed up the check-in process with QR code scanning, reducing wait times and improving the attendee experience.",
    },
    {
      icon: LineChart,
      title: "Actionable Analytics & Reporting",
      description:
        "Gain valuable insights into event performance with detailed analytics and customizable reports, helping you optimize future events.",
    },
    {
      icon: Code,
      title: "API Integrations & Webhooks",
      description:
        "Connect TechEventPlanner with your existing tools and systems using our robust API and webhooks for seamless data integration.",
    },
    {
      icon: Settings,
      title: "Full Customization & Branding",
      description:
        "Customize the platform to match your brand with custom logos, color schemes, and event-specific branding options.",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Reliable Platform",
      description:
        "Rest assured with our secure and reliable platform, providing enterprise-grade security and data protection for your events.",
    },
  ]

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Unlock the Power of Seamless Event Management"
          subtitle="Key Features"
          description="Discover how TechEventPlanner simplifies event planning, boosts attendee engagement, and drives success for your tech events."
        />

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{
                y: -5,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                borderColor: "var(--primary)",
                transition: { duration: 0.3 },
              }}
              className="bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-md"
            >
              <motion.div
                variants={iconAnimation}
                whileHover="hover"
                className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
              >
                <feature.icon className="h-6 w-6 text-primary" />
              </motion.div>
              <motion.h3
                className="text-xl font-semibold mb-2"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } },
                }}
              >
                {feature.title}
              </motion.h3>
              <motion.p
                className="text-muted-foreground"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { delay: 0.3 } },
                }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
