import { PricingSection } from "@/components/landing/pricing-section-enhanced"
import MarketingLayout from "./layout"

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto py-12 px-4">
        <PricingSection />
      </div>
    </MarketingLayout>
  )
}
