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
            Connecting communities through seamless event experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Our Story</h3>
            <p className="text-muted-foreground mb-4">
              Tech Milap was born from a shared frustration among tech event organizers who struggled with fragmented
              tools and complex workflows. Founded in 2023 by a diverse team of event planners, developers, and
              community builders, we set out to create a unified platform that would make tech event management
              accessible to everyone.
            </p>
            <p className="text-muted-foreground mb-4">
              The name "Milap" comes from the Sanskrit word meaning "union" or "coming together" - reflecting our
              mission to bring people together through meaningful events and experiences. What started as a small
              project has now grown into a comprehensive platform serving thousands of event organizers across the
              globe.
            </p>
            <p className="text-muted-foreground">
              Today, Tech Milap powers conferences, hackathons, workshops, and meetups of all sizes, helping organizers
              focus on what matters most: creating impactful experiences for their communities.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-4">Our Mission & Vision</h3>
            <div className="mb-6">
              <h4 className="text-xl font-medium mb-2">Mission</h4>
              <p className="text-muted-foreground">
                To democratize event management by providing intuitive tools that empower organizers to create memorable
                tech events without technical barriers.
              </p>
            </div>
            <div className="mb-6">
              <h4 className="text-xl font-medium mb-2">Vision</h4>
              <p className="text-muted-foreground">
                A world where every community has access to the tools they need to bring people together, share
                knowledge, and foster innovation through well-organized events.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-medium mb-2">Our Values</h4>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <span className="font-medium">Inclusivity:</span> We design for everyone, ensuring our platform is
                  accessible and usable by organizers of all backgrounds.
                </li>
                <li>
                  <span className="font-medium">Innovation:</span> We continuously push the boundaries of what's
                  possible in event management technology.
                </li>
                <li>
                  <span className="font-medium">Community-first:</span> We prioritize the needs of communities and their
                  organizers in every decision we make.
                </li>
                <li>
                  <span className="font-medium">Reliability:</span> We build robust solutions that organizers can depend
                  on for their most important events.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6 text-center">What Sets Us Apart</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-semibold text-xl mb-3">End-to-End Solution</h4>
              <p className="text-muted-foreground">
                From registration to post-event analytics, we provide a comprehensive suite of tools designed
                specifically for tech events.
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-semibold text-xl mb-3">Community Insights</h4>
              <p className="text-muted-foreground">
                Our platform doesn't just manage events—it helps you understand your community better through powerful
                analytics and engagement tools.
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg">
              <h4 className="font-semibold text-xl mb-3">Built By Organizers</h4>
              <p className="text-muted-foreground">
                Our team has organized hundreds of events collectively, bringing real-world experience to every feature
                we build.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6 text-center">Our Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <p className="text-center text-muted-foreground">Events powered by our platform</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold mb-2">1M+</div>
              <p className="text-center text-muted-foreground">Attendees registered through Tech Milap</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <p className="text-center text-muted-foreground">Countries with active Tech Milap events</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <p className="text-center text-muted-foreground">Organizer satisfaction rate</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-6 text-center">Meet the Leadership Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img src="/joyful-portrait.png" alt="Rahul Sharma" className="object-cover w-full h-full" />
              </div>
              <h4 className="font-semibold">Rahul Sharma</h4>
              <p className="text-sm text-muted-foreground mb-2">Co-founder & CEO</p>
              <p className="text-sm text-muted-foreground">
                Former tech conference organizer with 10+ years of experience building community-driven events.
              </p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img src="/confident-asian-professional.png" alt="Mei Lin" className="object-cover w-full h-full" />
              </div>
              <h4 className="font-semibold">Mei Lin</h4>
              <p className="text-sm text-muted-foreground mb-2">Co-founder & CTO</p>
              <p className="text-sm text-muted-foreground">
                Full-stack developer and hackathon enthusiast who has built event tools for major tech companies.
              </p>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                <img src="/confident-leader.png" alt="Alex Johnson" className="object-cover w-full h-full" />
              </div>
              <h4 className="font-semibold">Alex Johnson</h4>
              <p className="text-sm text-muted-foreground mb-2">Chief Product Officer</p>
              <p className="text-sm text-muted-foreground">
                Product leader with experience at leading event technology companies and a passion for user-centered
                design.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
