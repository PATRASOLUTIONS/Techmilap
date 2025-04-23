import { FeaturesSection } from "@/components/landing/features-section-enhanced"
import MarketingLayout from "./layout"

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto py-12 px-4">
        <FeaturesSection />
      </div>
    </MarketingLayout>
  )
}
