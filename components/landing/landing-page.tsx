"use client"

import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { HeroSection } from "@/components/landing/hero-section-enhanced"
import { FeaturesSection } from "@/components/landing/features-section-enhanced"
import { TestimonialsSection } from "@/components/landing/testimonials-section-enhanced"
import { CtaSection } from "@/components/landing/cta-section"
import { StatsSectionWrapper } from "@/components/landing/stats-section-wrapper"
import { PartnersSection } from "@/components/landing/partners-section"
import { ContactSection } from "@/components/landing/contact-section"
import { DecorativeBlob } from "@/components/ui/decorative-blob"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
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
        {/* Add more decorative dots */}
        <motion.div
          className="absolute top-[10%] left-[10%] w-4 h-4 rounded-full bg-primary/30 blur-sm"
          animate={{
            x: [0, 20, 0],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[10%] w-6 h-6 rounded-full bg-secondary/30 blur-sm"
          animate={{
            x: [0, -15, 0],
            y: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Landing Header with Login/Register */}
        <LandingHeader />

        {/* Add padding to account for fixed header */}
        <div className="pt-24">
          {/* Enhanced Hero Section */}
          <HeroSection />

          {/* Partners Section */}
          <PartnersSection />

          {/* Stats Section - Using the client component wrapper */}
          <StatsSectionWrapper />

          {/* Enhanced Features Section */}
          <FeaturesSection />

          {/* Enhanced Testimonials Section */}
          <TestimonialsSection />

          {/* CTA Section */}
          <CtaSection />

          {/* Contact Section */}
          <ContactSection />

          {/* Footer */}
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}
