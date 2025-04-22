"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useAnimation } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Users, CheckCircle } from "lucide-react"
import { useInView } from "framer-motion"
import { useRef } from "react"

export function HeroSection() {
  const [isHovered, setIsHovered] = useState(false)
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [controls, isInView])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
        delay: 0.6,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  }

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  }

  const backgroundBlobVariants = {
    hidden: { opacity: 0, scale: 0.2 },
    visible: {
      opacity: 0.8,
      scale: 1,
      transition: {
        duration: 1.5,
        delay: 0.2,
      },
    },
  }

  const checkItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 1 + i * 0.1,
        duration: 0.5,
      },
    }),
  }

  return (
    <section ref={ref} className="relative py-20 md:py-28 overflow-hidden">
      <motion.div
        className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl"
        variants={backgroundBlobVariants}
        initial="hidden"
        animate={controls}
      />
      <motion.div
        className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
        variants={backgroundBlobVariants}
        initial="hidden"
        animate={controls}
      />

      <div className="container px-4 md:px-6">
        <motion.div
          className="grid gap-12 md:grid-cols-2 md:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Plan & Host Amazing{" "}
                <motion.span
                  className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  Tech Events
                </motion.span>
              </h1>
            </motion.div>
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground md:text-2xl max-w-[600px]">
              Your all-in-one platform for planning, managing, and hosting successful tech events of any size.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="h-12 px-6 relative overflow-hidden group">
                <Link href="/signup">
                  <motion.span
                    className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"
                    initial={false}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                  Get Started
                  <motion.div
                    className="ml-2 h-4 w-4 inline-block"
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-6 relative overflow-hidden">
                <Link href="#features">
                  <motion.span
                    className="absolute inset-0 opacity-0 bg-primary/10"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  Learn More
                </Link>
              </Button>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4"
            >
              <motion.div className="flex -space-x-2" animate={floatingAnimation}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-muted">
                    <Image
                      src={`/diverse-group-city.png?height=32&width=32&query=person${i}`}
                      alt={`User ${i}`}
                      width={32}
                      height={32}
                    />
                  </div>
                ))}
              </motion.div>
              <motion.div className="text-sm text-muted-foreground" variants={itemVariants}>
                <motion.span
                  className="font-medium text-foreground"
                  animate={{
                    color: ["#000", "#6366f1", "#000"],
                  }}
                  transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                >
                  500+
                </motion.span>{" "}
                event planners trust our platform
              </motion.div>
            </motion.div>
            <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4 pt-4">
              {["Easy to use", "Customizable", "Secure payments", "24/7 support"].map((item, i) => (
                <motion.div key={i} className="flex items-center gap-2" custom={i} variants={checkItemVariants}>
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="text-sm">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <motion.div variants={imageVariants} whileHover="hover" className="relative">
            <div className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="overflow-hidden rounded-2xl border shadow-xl transition-all"
              >
                <div className="relative aspect-[4/3] md:aspect-[16/10]">
                  <Image src="/bustling-tech-summit.png" alt="Tech Event" fill className="object-cover" />
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white"
                  initial={{ y: 20, opacity: 0.8 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <h3 className="text-xl font-bold">Annual Developer Conference</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      <span className="text-sm">June 15-17, 2023</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      <span className="text-sm">1,200+ Attendees</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            <motion.div
              className="absolute -top-6 -right-6 -z-10 h-full w-full rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: isHovered ? 1.05 : 1,
              }}
              transition={{
                opacity: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                scale: { duration: 0.3 },
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
