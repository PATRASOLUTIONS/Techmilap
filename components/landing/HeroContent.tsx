"use client"

import { Anton } from "next/font/google"
import { motion } from "framer-motion"
import Link from "next/link"

const fontAnton = Anton({
  weight: "400",
  subsets: ["latin"],
})

export default function HeroContent() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-32 pb-16 md:pb-0">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col items-center lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left Column - Main Content */}
          <div className="space-y-8 text-center lg:text-left mb-12 lg:mb-0 mt-8 md:mt-0 w-full">
            <div className={`space-y-4 ${fontAnton.className}`}>
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#154c79] tracking-wide leading-tight"
              >
                Enjoy events
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl text-[#b8860b]"
              >
                as much as you
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="text-2xl md:text-3xl lg:text-4xl text-[#5e348a]"
              >
                can.
              </motion.p>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className="font-sans text-lg text-neutral-600 max-w-md mx-auto lg:mx-0"
            >
              Create your own events and publish them to connect with your community
            </motion.p>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto lg:mx-0 justify-center lg:justify-start"
            >
              <Link href={"/signup"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#b8860b] to-[#d8a62a] text-white px-8 py-4 rounded-full
                          font-semibold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl
                          whitespace-nowrap"
                >
                  Get Started
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Image - Shown on all devices, positioned differently */}
          <div className="w-full max-w-md lg:max-w-none">
            <div className="relative w-full h-[300px] sm:h-[350px] lg:w-[500px] lg:h-[400px] mx-auto mb-10">
              <img
                src="/HomePageTopImage1.jpg"
                alt="Tech Events"
                className="w-full h-full object-cover rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
