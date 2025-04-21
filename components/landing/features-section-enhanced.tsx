"use client"

import { useRef } from "react"
import { motion, useInView, useAnimation } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Calendar, CreditCard, LineChart, Mail, MessageSquare, QrCode, Settings, Ticket, Users } from "lucide-react"
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
      icon: Calendar,
      title: "Event Planning",
      description: "Create and manage events with customizable registration forms, schedules, and speaker profiles.",
    },
    {
      icon: Ticket,
      title: "Ticketing",
      description: "Sell tickets with flexible pricing options, discount codes, and group rates.",
    },
    {
      icon: Users,
      title: "Attendee Management",
      description: "Track registrations, send reminders, and manage check-ins with our powerful tools.",
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description: "Send targeted emails to promote your events and keep attendees informed.",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Accept payments securely with our integrated payment processing system.",
    },
    {
      icon: QrCode,
      title: "QR Code Check-in",
      description: "Streamline the check-in process with QR code scanning for quick and easy entry.",
    },
    {
      icon: LineChart,
      title: "Analytics",
      description: "Gain insights into your event performance with detailed analytics and reports.",
    },
    {
      icon: MessageSquare,
      title: "Networking",
      description: "Enable attendees to connect and network before, during, and after your events.",
    },
    {
      icon: Settings,
      title: "Customization",
      description: "Tailor the platform to your needs with customizable branding and settings.",
    },
  ]

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Powerful Features for Successful Events"
          subtitle="What We Offer"
          description="Everything you need to plan, manage, and host exceptional tech events that leave a lasting impression."
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
