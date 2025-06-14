"use client";

import Link from "next/link";
import { StaggeredText } from "./TextAnimation";
import { motion } from "framer-motion";

export default function TextAnimationSection() {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#154c79] via-[#5e348a] to-[#b8860b]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Staggered Text Animation */}
      <div className="relative z-10">
        <StaggeredText
          text="TECH MILAP EXPERIENCE"
          className="text-white"
          once={false}
        />
      </div>
      {/* Wrapper for positioning and centering */}
      <div
        className="absolute bottom-20 z-10 w-full left-0 right-0 px-4 sm:px-0 sm:w-auto sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto"
      >
        {/* Motion div for animation and content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full text-center" // w-full ensures it fills the (now correctly sized) parent
        >
          <p className="text-white/80 text-lg mb-4">
            Create, Connect, Collaborate
          </p>
          <Link href={"/events"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full
                    font-semibold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl
                    border border-white/30">
              Explore Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
