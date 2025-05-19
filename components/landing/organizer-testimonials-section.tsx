"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useInView, useAnimation } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function OrganizerTestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Conference Director",
      organization: "TechSummit India",
      image: "/confident-indian-professional.png",
      content:
        "After trying 3 different platforms for our annual tech conference, this platform has been a game-changer. The customizable registration forms and real-time analytics helped us increase attendance by 32% and saved us countless hours of manual work.",
      rating: 5,
      eventType: "Tech Conference",
      attendees: "1,200+",
    },
    {
      name: "Marcus Johnson",
      role: "Community Manager",
      organization: "DevNetwork Global",
      image: "/confident-leader.png",
      content:
        "What sets this platform apart is how it understands the unique needs of tech events. The speaker management system and custom form builder allowed us to create a seamless experience for both attendees and presenters. The check-in system is lightning fast!",
      rating: 5,
      eventType: "Developer Meetups",
      attendees: "300-500",
    },
    {
      name: "Elena Rodriguez",
      role: "Events Director",
      organization: "StartupHub Barcelona",
      image: "/confident-blonde-professional.png",
      content:
        "I've organized over 50 startup events, and this is the only platform that truly understands what tech event organizers need. The analytics dashboard provides insights I couldn't get elsewhere, and the ticket management system is incredibly flexible.",
      rating: 5,
      eventType: "Startup Pitch Events",
      attendees: "200-400",
    },
    {
      name: "Hiroshi Tanaka",
      role: "Innovation Lead",
      organization: "Tokyo Tech Alliance",
      image: "/confident-asian-professional.png",
      content:
        "The multi-language support and customizable forms made our international hackathon so much easier to manage. Other platforms we tried couldn't handle our complex registration workflow, but this solution made it simple.",
      rating: 4,
      eventType: "Hackathons",
      attendees: "500+",
    },
    {
      name: "Carlos Mendez",
      role: "CEO",
      organization: "LatAm Tech Events",
      image: "/joyful-latino-portrait.png",
      content:
        "We switched from a general event platform to this tech-focused solution and immediately saw the difference. The volunteer management system alone saved us 20+ hours of work per event. The ROI has been incredible.",
      rating: 5,
      eventType: "Tech Workshops",
      attendees: "100-300",
    },
    {
      name: "Sarah Williams",
      role: "Head of Events",
      organization: "Women in Tech Foundation",
      image: "/joyful-portrait.png",
      content:
        "This platform offers features I couldn't find anywhere else, like customizable application forms for speakers and specialized analytics for tech events. The team behind it clearly understands the unique challenges of organizing tech conferences.",
      rating: 5,
      eventType: "Diversity in Tech Events",
      attendees: "800+",
    },
  ]

  return (
    <section id="organizer-testimonials" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Event Organizers Love Our Platform"
          subtitle="Success Stories"
          description="Don't just take our word for it. Here's what tech event organizers around the world have to say about their experience with our platform."
        />

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.3 },
              }}
            >
              <Card className="h-full overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-sm font-medium text-primary">{testimonial.organization}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {testimonial.eventType}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      {testimonial.attendees} Attendees
                    </Badge>
                  </div>

                  <div className="flex mb-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"
                          }`}
                        />
                      ))}
                  </div>

                  <div className="relative flex-grow">
                    <Quote className="absolute top-0 left-0 h-6 w-6 text-primary/20 -translate-x-1 -translate-y-1" />
                    <p className="text-muted-foreground pl-5 italic">"{testimonial.content}"</p>
                  </div>

                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-secondary/40"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    viewport={{ once: true }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block"
          >
            <Badge variant="secondary" className="text-lg py-2 px-4">
              Join 1,000+ event organizers who trust our platform
            </Badge>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
