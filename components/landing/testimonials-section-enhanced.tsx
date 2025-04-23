"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { motion, useInView, useAnimation } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

export function TestimonialsSection() {
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
      name: "Anya Sharma",
      role: "Conference Director, FutureTech Summit",
      image: "/joyful-portrait.png",
      content:
        "TechEventPlanner has been a game-changer for our annual FutureTech Summit. The platform's intuitive interface and powerful features have streamlined our event planning process, allowing us to focus on creating an exceptional experience for our attendees.",
      rating: 5,
    },
    {
      name: "Kenji Tanaka",
      role: "Lead Organizer, Tokyo DevCon",
      image: "/confident-asian-professional.png",
      content:
        "As a lead organizer for Tokyo DevCon, I'm always looking for ways to improve our event management. TechEventPlanner's attendee management and analytics tools have been invaluable in helping us understand our audience and optimize our event strategy.",
      rating: 5,
    },
    {
      name: "Isabella Rodriguez",
      role: "Event Coordinator, Global AI Conference",
      image: "/confident-leader.png",
      content:
        "TechEventPlanner has transformed the way we manage our Global AI Conference. The platform's speaker management and ticketing features have saved us countless hours, and the support team is always there to help when we need it.",
      rating: 4,
    },
    {
      name: "Ethan Williams",
      role: "Founder, CodeCamp",
      image: "/joyful-latino-portrait.png",
      content:
        "I've been using TechEventPlanner for my coding workshops for the past year, and I couldn't be happier. The platform is easy to use, customizable, and has all the features I need to run successful events.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Marketing Manager, InnovateX",
      image: "/confident-blonde-professional.png",
      content:
        "TechEventPlanner has helped us elevate our brand and create a more engaging experience for our attendees. The platform's customization options and marketing tools have been instrumental in driving attendance and generating leads.",
      rating: 4,
    },
    {
      name: "Omar Hassan",
      role: "CEO, StartupHub",
      image: "/confident-indian-professional.png",
      content:
        "As a CEO of StartupHub, I'm always looking for ways to connect with the tech community. TechEventPlanner has made it easy for us to host meetups, workshops, and conferences that bring together the best and brightest minds in the industry.",
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="py-20">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Trusted by Leading Tech Innovators"
          subtitle="Testimonials"
          description="See why event organizers and tech leaders around the world rely on TechEventPlanner to power their events."
        />

        <motion.div
          ref={ref}
          variants={container}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
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
              <Card className="h-full overflow-hidden">
                <CardContent className="p-6">
                  <motion.div
                    className="flex items-center gap-4 mb-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 * index, duration: 0.5 }}
                  >
                    <motion.div
                      className="relative h-12 w-12 rounded-full overflow-hidden"
                      whileHover={{ scale: 1.1 }}
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
                      <h3 className="font-semibold">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 * index, duration: 0.5 }}
                  >
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { delay: 0.3 * index + i * 0.1, duration: 0.3 },
                          }}
                        >
                          <Star
                            className={`h-4 w-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                          />
                        </motion.div>
                      ))}
                  </motion.div>
                  <motion.p
                    className="text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 * index, duration: 0.5 }}
                  >
                    {testimonial.content}
                  </motion.p>

                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 to-secondary/40"
                    initial={{ scaleX: 0, originX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ delay: 0.5 * index, duration: 0.8 }}
                    viewport={{ once: true }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
