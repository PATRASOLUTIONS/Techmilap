import { PricingSection } from "@/components/landing/pricing-section-enhanced"
import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { DecorativeBlob } from "@/components/ui/decorative-blob"

export const metadata = {
  title: "Pricing | Tech Milap",
  description: "Choose the perfect pricing plan for your event management needs with Tech Milap.",
}

export default function PricingPage() {
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
      </div>

      <div className="relative z-10">
        {/* Landing Header with Login/Register */}
        <LandingHeader />

        {/* Add padding to account for fixed header */}
        <div className="pt-24">
          <PricingSection />
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}
