import { LandingHeader } from "@/components/landing/landing-header"
import { SiteFooter } from "@/components/site-footer"
import { DecorativeBlob } from "@/components/ui/decorative-blob"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Globe, Award, Heart, Lightbulb, Handshake, Shield, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Navbar from "@/components/landing/NavBar"

export const metadata = {
  title: "About Us | Tech Milap",
  description: "Learn about Tech Milap and our mission to revolutionize tech event planning.",
}

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-b from-background to-muted/20">
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
        <Navbar/>

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
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-24">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Our Story
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Connecting communities through seamless event experiences
        </p>
      </div>

      {/* About Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
        <div>
          <h2 className="text-3xl font-bold mb-6">The Tech Milap Journey</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Tech Milap was born from a shared frustration among tech event organizers who struggled with fragmented
            tools and complex workflows. Founded in 2023 by a diverse team of event planners, developers, and community
            builders, we set out to create a unified platform that would make tech event management accessible to
            everyone.
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            The name "Milap" comes from the Sanskrit word meaning "union" or "coming together" - reflecting our mission
            to bring people together through meaningful events and experiences. What started as a small project has now
            grown into a comprehensive platform serving thousands of event organizers across the globe.
          </p>
          <p className="text-lg text-muted-foreground">
            Today, Tech Milap powers conferences, hackathons, workshops, and meetups of all sizes, helping organizers
            focus on what matters most: creating impactful experiences for their communities.
          </p>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/diverse-group-city.png"
            alt="Tech Milap Team"
            width={600}
            height={400}
            className="object-cover w-full"
          />
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Our Mission & Vision</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Guided by our core values, we're building the future of event management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Mission
              </h3>
              <p className="text-lg">
                To democratize event management by providing intuitive tools that empower organizers to create memorable
                tech events without technical barriers.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Vision
              </h3>
              <p className="text-lg">
                A world where every community has access to the tools they need to bring people together, share
                knowledge, and foster innovation through well-organized events.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Core Values */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">The principles that guide everything we do</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ValueCard
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Inclusivity"
            description="We design for everyone, ensuring our platform is accessible and usable by organizers of all backgrounds."
          />
          <ValueCard
            icon={<Lightbulb className="h-10 w-10 text-primary" />}
            title="Innovation"
            description="We continuously push the boundaries of what's possible in event management technology."
          />
          <ValueCard
            icon={<Heart className="h-10 w-10 text-primary" />}
            title="Community-first"
            description="We prioritize the needs of communities and their organizers in every decision we make."
          />
          <ValueCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Reliability"
            description="We build robust solutions that organizers can depend on for their most important events."
          />
        </div>
      </div>

      {/* Impact Stats */}
      <div className="mb-24 bg-muted/50 rounded-2xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">The numbers that drive us forward</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard number="10,000+" label="Events powered" />
          <StatCard number="1M+" label="Attendees registered" />
          <StatCard number="50+" label="Countries with active events" />
          <StatCard number="98%" label="Organizer satisfaction rate" />
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Meet Our Leadership Team</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            The passionate individuals driving our mission forward
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TeamMember
            image="/joyful-portrait.png"
            name="Rahul Sharma"
            title="Co-founder & CEO"
            bio="Former tech conference organizer with 10+ years of experience building community-driven events."
          />
          <TeamMember
            image="/confident-asian-professional.png"
            name="Mei Lin"
            title="Co-founder & CTO"
            bio="Full-stack developer and hackathon enthusiast who has built event tools for major tech companies."
          />
          <TeamMember
            image="/confident-leader.png"
            name="Alex Johnson"
            title="Chief Product Officer"
            bio="Product leader with experience at leading event technology companies and a passion for user-centered design."
          />
        </div>
      </div>

      {/* What Sets Us Apart */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What Sets Us Apart</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">The Tech Milap difference</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Clock className="h-10 w-10 text-primary" />}
            title="End-to-End Solution"
            description="From registration to post-event analytics, we provide a comprehensive suite of tools designed specifically for tech events."
          />
          <FeatureCard
            icon={<Award className="h-10 w-10 text-primary" />}
            title="Community Insights"
            description="Our platform doesn't just manage events—it helps you understand your community better through powerful analytics and engagement tools."
          />
          <FeatureCard
            icon={<Handshake className="h-10 w-10 text-primary" />}
            title="Built By Organizers"
            description="Our team has organized hundreds of events collectively, bringing real-world experience to every feature we build."
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-muted/50 rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Be part of the Tech Milap story and transform how you create and manage events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ValueCard({ icon, title, description }) {
  return (
    <div className="text-center p-6">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function StatCard({ number, label }) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl md:text-5xl font-bold mb-2 text-primary">{number}</div>
      <p className="text-lg text-muted-foreground">{label}</p>
    </div>
  )
}

function TeamMember({ image, name, title, bio }) {
  return (
    <div className="text-center">
      <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
        <Image src={image || "/placeholder.svg"} alt={name} fill className="object-cover" />
      </div>
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="text-primary mb-2">{title}</p>
      <p className="text-muted-foreground">{bio}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6 flex flex-col h-full items-center text-center">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
