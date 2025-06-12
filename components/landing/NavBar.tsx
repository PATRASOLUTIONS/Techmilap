"use client";

import { formatFieldName } from "@/lib/csv-export";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

type NavbarHeadingType = { fieldName: String; fieldLink: String }[];

const navbarHeading: NavbarHeadingType = [
  { fieldName: "Explore Events", fieldLink: "/events" },
  { fieldName: "Features", fieldLink: "/features" },
  { fieldName: "FAQ", fieldLink: "/FAQ" },
  { fieldName: "About", fieldLink: "/about" },
  { fieldName: "Pricing", fieldLink: "/pricing" },
];

export default function Navbar() {
  // const { session: data } = useSession();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed w-full top-0 z-50 py-6"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div
          className="flex justify-between items-center px-6 md:px-10 py-4 rounded-full 
                        backdrop-blur-md bg-white/10 shadow-lg 
                        border border-white/20 transition-all duration-300
                        hover:shadow-xl hover:bg-white/20"
        >
          <div className="flex justify-center gap-2">
            <Image
              src="/techmilap-logo-round.png"
              alt="Tech Milap Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-[#F59E0B] to-[#8B5CF6] bg-clip-text text-transparent"
            >
              Tech Milap
            </motion.div>
          </div>

          {/* Navigation Menu - Hidden on mobile */}
          <div className="hidden md:block">
            {/* <ul className="flex gap-6 lg:gap-8">
              {["Explore Events", "Features", "About", "FAQ", "Pricing"].map(
                (item) => (
                  <motion.li
                    key={item}
                    whileHover={{ scale: 1.05 }}
                    className="text-gray-700 hover:text-[#F59E0B] transition-colors duration-300 cursor-pointer font-semibold"
                  >
                    {item}
                  </motion.li>
                )
              )}
            </ul> */}

            <ul className="md:flex items-center gap-6">
              {navbarHeading.map((fields) => (
                <motion.li
                  whileHover={{ scale: 1.05 }}
                  className="text-gray-700 hover:text-[#0aacf7]"
                  key={fields.fieldName}
                >
                  <Link href={fields.fieldLink}>{fields.fieldName}</Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 md:gap-6 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-700 hover:text-[#F59E0B] transition-colors duration-300 font-semibold text-sm md:text-base"
            >
              MyEvents
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#4C1D95] text-white px-3 md:px-4 py-2 rounded-full 
                        hover:bg-[#5B21B6] transition-colors duration-300
                        shadow-md hover:shadow-lg font-semibold text-sm md:text-base"
            >
              Dashboard
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
