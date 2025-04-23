import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { DecorativeBlob } from "@/components/ui/decorative-blob"

export const metadata = {
  title: "About Us | Tech Milap",
  description: "Learn about Tech Milap and our mission to revolutionize tech event planning.",
}

export default function AboutPage() {
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
          <AboutSection />
          <SiteFooter />
        </div>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">About Tech Milap</h2>
          <p className="text-muted-foreground mt-4 text-xl">
            Our mission is to revolutionize the way tech events are planned and managed, making it easier for organizers
            to create memorable experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Our Story</h3>
            <p className="text-muted-foreground">
              Tech Milap was founded in 2023 by a team of event planners and tech enthusiasts who saw the need for a
              better solution for managing tech-focused events. Frustrated with the limitations of existing platforms,
              they set out to build a comprehensive tool that would address the unique challenges of the tech event
              industry.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4">Our Values</h3>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Innovation: We are committed to pushing the boundaries of what's possible in event management.</li>
              <li>User-Centricity: We prioritize the needs and feedback of our users in everything we do.</li>
              <li>Excellence: We strive for the highest standards of quality in our platform and services.</li>
              <li>Community: We believe in the power of community and aim to foster connections through events.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-4">Meet the Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img src="/joyful-portrait.png" alt="Team Member 1" className="object-cover w-full h-full" />
              </div>
              <h4 className="font-semibold">John Doe</h4>
              <p className="text-sm text-muted-foreground">CEO</p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img
                  src="/confident-asian-professional.png"
                  alt="Team Member 2"
                  className="object-cover w-full h-full"
                />
              </div>
              <h4 className="font-semibold">Jane Smith</h4>
              <p className="text-sm text-muted-foreground">CTO</p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img src="/confident-leader.png" alt="Team Member 3" className="object-cover w-full h-full" />
              </div>
              <h4 className="font-semibold">David Lee</h4>
              <p className="text-sm text-muted-foreground">Head of Marketing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
