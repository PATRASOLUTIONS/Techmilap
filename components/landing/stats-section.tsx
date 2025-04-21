"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Calendar, Users, Award, Globe } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

export function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const stats = [
    {
      icon: Calendar,
      value: 5000,
      label: "Events Hosted",
      color: "text-blue-500",
    },
    {
      icon: Users,
      value: 250000,
      label: "Attendees",
      color: "text-green-500",
    },
    {
      icon: Award,
      value: 98,
      label: "Satisfaction Rate",
      suffix: "%",
      color: "text-yellow-500",
    },
    {
      icon: Globe,
      value: 50,
      label: "Countries",
      color: "text-purple-500",
    },
  ]

  return (
    <section className="py-16">
      <div className="container px-4 md:px-6">
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={item} className="flex flex-col items-center text-center space-y-2">
              <div className={`rounded-full p-3 ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-bold">
                <AnimatedCounter from={0} to={stat.value} />
                {stat.suffix}
              </h3>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
