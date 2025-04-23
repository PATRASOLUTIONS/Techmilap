import { SectionHeading } from "@/components/ui/section-heading"
import MarketingLayout from "./layout"

export default function AboutUsPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto py-12 px-4">
        <SectionHeading
          title="About Us"
          subtitle="Our Story"
          description="Learn more about TechEventPlanner and our mission to revolutionize tech event management."
        />
        <div className="prose max-w-none mt-8">
          <p>
            TechEventPlanner is a platform dedicated to simplifying the process of planning, managing, and hosting
            successful tech events. We believe that technology should empower event organizers, not complicate their
            lives.
          </p>
          <p>
            Our team is composed of experienced event planners, software developers, and tech enthusiasts who are
            passionate about creating innovative solutions for the event industry.
          </p>
          <p>
            We are committed to providing a user-friendly, feature-rich platform that meets the unique needs of tech
            events. Whether you're organizing a small meetup or a large conference, TechEventPlanner has everything you
            need to succeed.
          </p>
        </div>
      </div>
    </MarketingLayout>
  )
}
