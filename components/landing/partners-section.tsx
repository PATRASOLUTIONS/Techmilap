"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"

export function PartnersSection() {
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  const partners = [
    { name: "Google", logo: "/colorful-search-bar.png" },
    { name: "Microsoft", logo: "/four-squares-logo.png" },
    { name: "Amazon", logo: "/smiling-arrow.png" },
    { name: "Apple", logo: "/stylized-fruit-logo.png" },
    { name: "Meta", logo: "/interconnected-infinity.png" },
    { name: "Salesforce", logo: "/placeholder.svg?height=40&width=120&query=Salesforce%20logo" },
  ]

  return (
    <section className="py-12 border-t border-b border-border/40">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground">TRUSTED BY LEADING TECH COMPANIES</p>
        </div>
        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12"
        >
          {partners.map((partner, index) => (
            <motion.div key={index} variants={item} className="grayscale hover:grayscale-0 transition-all">
              <Image src={partner.logo || "/placeholder.svg"} alt={partner.name} width={120} height={40} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
