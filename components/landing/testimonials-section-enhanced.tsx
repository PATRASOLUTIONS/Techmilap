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
      controls.start("visible").catch((err) => {
        console.error("Animation error in testimonials:", err)
      })
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
      name: "Sarah Johnson",
      role: "Event Manager at TechCorp",
      image: "/joyful-portrait.png",
      content:
        "TechEventPlanner has transformed how we organize our annual developer conference. The platform is intuitive, powerful, and has saved us countless hours of manual work.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "CTO at StartupHub",
      image: "/confident-asian-professional.png",
      content:
        "We've tried several event management platforms, but TechEventPlanner stands out with its tech-focused features and excellent customer support. Highly recommended!",
      rating: 5,
    },
    {
      name: "Jessica Williams",
      role: "Community Manager at DevNetwork",
      image: "/confident-leader.png",
      content:
        "The analytics and attendee management features have given us valuable insights into our events. We've been able to grow our community events by 40% since using this platform.",
      rating: 4,
    },
    {
      name: "David Rodriguez",
      role: "Marketing Director at InnovateX",
      image: "/joyful-latino-portrait.png",
      content:
        "The customization options allowed us to create a branded experience that perfectly matched our company's identity. Our attendees were impressed with the seamless registration process.",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      role: "Conference Organizer",
      image: "/confident-blonde-professional.png",
      content:
        "TechEventPlanner made it easy to manage multiple tracks and sessions for our conference. The scheduling features are particularly impressive and user-friendly.",
      rating: 4,
    },
    {
      name: "Alex Patel",
      role: "Founder of CodeCamp",
      image: "/confident-indian-professional.png",
      content:
        "As someone who runs coding workshops regularly, I needed a platform that understood the unique needs of tech events. This solution has exceeded my expectations in every way.",
      rating: 5,
    },
  ]

  return (
    <section id="testimonials" className="py-20">
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="What Our Customers Say"
          subtitle="Testimonials"
          description="Don't just take our word for it. Here's what event organizers have to say about their experience with TechEventPlanner."
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
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=48&query=person"
                        }}
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
