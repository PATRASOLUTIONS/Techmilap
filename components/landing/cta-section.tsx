"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { motion, useInView, useAnimation } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const controls = useAnimation()

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

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delay: 0.4,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  }

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1 },
    },
  }

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/5"
        variants={backgroundVariants}
        initial="hidden"
        animate={controls}
      />

      <motion.div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
        variants={backgroundVariants}
        initial="hidden"
        animate={controls}
        whileInView={{
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"
        variants={backgroundVariants}
        initial="hidden"
        animate={controls}
        whileInView={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <motion.h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl" variants={itemVariants}>
            Ready to Create Your Next{" "}
            <motion.span
              className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              Successful Event?
            </motion.span>
          </motion.h2>

          <motion.p className="text-xl text-muted-foreground" variants={itemVariants}>
            Join thousands of event planners who are creating memorable experiences with our platform.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row justify-center gap-4" variants={itemVariants}>
            <motion.div variants={buttonVariants} whileHover="hover">
              <Button size="lg" asChild className="h-12 px-8 relative overflow-hidden group">
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
            </motion.div>

            <motion.div variants={buttonVariants} whileHover="hover">
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            No credit card required. Free plan available.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
