"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type NavbarHeadingType = { fieldName: string; fieldLink: string }[];

const navbarHeading: NavbarHeadingType = [
  { fieldName: "Explore Events", fieldLink: "/events" },
  { fieldName: "Features", fieldLink: "/features" },
  { fieldName: "FAQ", fieldLink: "/FAQ" },
  { fieldName: "About", fieldLink: "/about" },
  { fieldName: "Pricing", fieldLink: "/pricing" },
];

export default function Navbar() {
  const { data: session } = useSession();

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
          <Link href={"/"}>
            <div className="flex justify-center gap-2">
              <Image
                src="/techmilap-logo-round.png"
                alt="Tech Milap Logo"
                width={40}
                height={40}
                className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200"
              />
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mt-1 text-xl md:text-2xl font-extrabold bg-gradient-to-r from-[#F59E0B] to-[#8B5CF6] bg-clip-text text-transparent"
              >
                Tech Milap
              </motion.div>
            </div>
          </Link>

          {/* Navigation Menu - Hidden on mobile */}
          <div className="hidden md:block">
            <ul className="md:flex items-center gap-6">
              {navbarHeading.map((fields) => (
                <motion.li
                  whileHover={{ scale: 1.05 }}
                  className="text-gray-700 hover:text-[#0aacf7]"
                  key={fields.fieldName.toString()}
                >
                  <Link href={fields.fieldLink}>{fields.fieldName}</Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {session ? (
              // Show these buttons when user is logged in
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-[#170f83] hover:text-[#0aacf7] hover:bg-[#170f83]/10"
                >
                  <Link href="/my-events">My Events</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#170f83] hover:bg-[#170f83]/90 text-white"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              // Show these buttons when user is not logged in
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-[#170f83] hover:text-[#0aacf7] hover:bg-[#170f83]/10"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#170f83] hover:bg-[#170f83]/90 text-white"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
