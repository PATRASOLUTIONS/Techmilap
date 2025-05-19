"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { SectionHeading } from "@/components/ui/section-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useInView } from "framer-motion"

export function TestimonialsSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sliderRef, { once: false, amount: 0.3 })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    // Pause autoplay temporarily when manually changing slides
    setAutoplay(false)
    setTimeout(() => setAutoplay(true), 5000)
  }

  // Handle autoplay
  useEffect(() => {
    if (isInView && autoplay) {
      intervalRef.current = setInterval(() => {
        nextSlide()
      }, 5000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isInView, autoplay, currentIndex])

  // Pause autoplay on hover
  const handleMouseEnter = () => setAutoplay(false)
  const handleMouseLeave = () => setAutoplay(true)

  // Calculate visible testimonials (current + next two)
  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ]

  return (
    <section
      id="testimonials"
      className="py-20 overflow-hidden"
      ref={sliderRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="container px-4 md:px-6">
        <SectionHeading
          title="Event Organizers Love Our Platform"
          subtitle="Success Stories"
          description="Don't just take our word for it. Here's what tech event organizers around the world have to say about their experience with our platform."
        />

        <div className="mt-16 relative">
          {/* Main slider */}
          <div className="relative overflow-hidden">
            <div className="flex items-stretch gap-6 transition-all duration-500 px-4">
              <AnimatePresence mode="wait">
                {visibleTestimonials.map((testimonial, index) => (
                  <motion.div
                    key={`${currentIndex}-${index}`}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className={cn("w-full md:w-1/3 flex-shrink-0", index === 0 ? "z-20" : index === 1 ? "z-10" : "z-0")}
                  >
                    <Card
                      className={cn(
                        "h-full overflow-hidden border shadow-lg transition-all duration-300",
                        index === 0
                          ? "border-primary/20 shadow-xl scale-100 opacity-100"
                          : "border-muted/20 scale-95 opacity-80",
                      )}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20">
                            <Image
                              src={testimonial.image || "/placeholder.svg"}
                              alt={testimonial.name}
                              fill
                              className="object-cover"
                            />
                          </div>
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
                          <p className="text-muted-foreground pl-5 italic line-clamp-4 md:line-clamp-6">
                            "{testimonial.content}"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between absolute top-1/2 left-0 right-0 -translate-y-1/2 px-4 z-30">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm border-primary/20 shadow-lg hover:bg-primary/10"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/80 backdrop-blur-sm border-primary/20 shadow-lg hover:bg-primary/10"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>

        {/* Dots navigation */}
        <div className="flex justify-center mt-8 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-primary w-6" : "bg-primary/30"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Badge variant="secondary" className="text-lg py-2 px-4">
            Join 1,000+ event organizers who trust our platform
          </Badge>
        </div>
      </div>
    </section>
  )
}
