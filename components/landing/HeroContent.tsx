"use client";

import { Anton } from "next/font/google";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const fontAnton = Anton({
  weight: "400",
  subsets: ["latin"],
});

export default function HeroContent() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen pt-20">
          {/* Left Column - Main Content */}
          <div className="space-y-8 ml-20">
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
              className="font-sans text-lg text-neutral-600 max-w-md"
            >
              Create your own events and publish them to connect with your
              community
            </motion.p>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 max-w-lg"
            >
              {/* <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="Your email..."
                  className="w-full px-6 py-4 rounded-full bg-white shadow-lg border border-[#b8860b]/30 
                           focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 focus:border-transparent
                           placeholder:text-neutral-400 text-gray-700"
                />
              </div> */}
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

          {/* Right Column - Decorative Elements */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* <CurlingArrow /> */}

              {/* Additional decorative elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-20 blur-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// export function CurlingArrow() {
//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.8 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.8, delay: 0.5 }}
//       className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
//     >
//       <motion.svg
//         width="200"
//         height="200"
//         viewBox="0 0 200 200"
//         fill="none"
//         xmlns="http://www.w3.org/2000/svg"
//         className="drop-shadow-lg"
//       >
//         {/* Main curved arrow */}
//         <motion.path
//           d="M160 40 C120 120, 80 140, 60 150"
//           stroke="#E6AEB2"
//           strokeWidth="6"
//           strokeLinecap="round"
//           fill="none"
//           initial={{ pathLength: 0, pathOffset: 1 }}
//           animate={{
//             pathLength: 1,
//             pathOffset: 0,
//           }}
//           transition={{
//             pathLength: { duration: 2, ease: "easeInOut" },
//             pathOffset: { duration: 2, ease: "easeInOut" },
//           }}
//         />

//         {/* Arrowhead */}
//         <motion.g
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 1.5, duration: 0.5 }}
//         >
//           <path
//             d="M58 140 L45 155 L65 158"
//             fill="#E6AEB2"
//             stroke="#E6AEB2"
//             strokeWidth="2"
//             strokeLinejoin="round"
//           />
//         </motion.g>

//         {/* Decorative swirl */}
//         <motion.path
//           d="M60 150 Q40 135 50 120"
//           stroke="#E6AEB2"
//           strokeWidth="3"
//           fill="none"
//           strokeDasharray="6 6"
//           initial={{ pathLength: 0, opacity: 0 }}
//           animate={{
//             pathLength: [0, 1, 0],
//             opacity: [0, 0.8, 0],
//           }}
//           transition={{
//             duration: 3,
//             repeat: Number.POSITIVE_INFINITY,
//             ease: "easeInOut",
//             delay: 2,
//           }}
//         />
//       </motion.svg>
//     </motion.div>
//   );
// }
