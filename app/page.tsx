"use client";

import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/hero-section-enhanced";
import { FeaturesSection } from "@/components/landing/features-section-enhanced";
import { CtaSection } from "@/components/landing/cta-section";
import { StatsSectionWrapper } from "@/components/landing/stats-section-wrapper";
import { WhyChooseUsSection } from "@/components/landing/why-choose-us-section";
import { TestimonialsSlider } from "@/components/landing/testimonials-slider";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { FaqSection } from "@/components/landing/faq-section";
import { DecorativeBlob } from "@/components/ui/decorative-blob";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/NavBar";
import HeroContent from "@/components/landing/HeroContent";
import TextAnimationSection from "@/components/landing/TextAnimation-section";
import { Integrations } from "@/components/landing/BlurIntegration";
import GalleryView from "@/components/landing/GalleryView";

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
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
        {/* <LandingHeader /> */}
        <Navbar />

        {/* Add padding to account for fixed header */}
        <div className="pt-0">
          {/* Enhanced Hero Section */}
          {/* <HeroSection /> */}
          <HeroContent />

          <TextAnimationSection />

          <Integrations />

          <GalleryView />

          {/* Stats Section - Using the client component wrapper */}
          <StatsSectionWrapper />

          {/* Why Choose Us Section */}
          <WhyChooseUsSection />

          {/* Comparison Table */}
          <ComparisonTable />

          {/* Enhanced Features Section */}
          <FeaturesSection />

          {/* Testimonials Slider */}
          <TestimonialsSlider />

          {/* FAQ Section */}
          {/* <FaqSection /> */}

          {/* CTA Section */}
          <CtaSection />

          {/* Footer */}
          <SiteFooter />
        </div>
      </div>
    </motion.div>
  );
}
