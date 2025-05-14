"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm py-2" : "bg-transparent py-4",
      )}
    >
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden">
            <Image
              src="/techmilap-logo-round.png"
              alt="Tech Milap Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="font-bold text-xl text-[#170f83]">TechMilap</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/events" className="text-black hover:text-[#0aacf7] transition-colors">
            Explore Events
          </Link>
          <Link href="/features" className="text-black hover:text-[#0aacf7] transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-black hover:text-[#0aacf7] transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-black hover:text-[#0aacf7] transition-colors">
            About
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Button asChild variant="ghost" className="text-[#170f83] hover:text-[#0aacf7] hover:bg-[#170f83]/10">
                <Link href="/my-events">My Events</Link>
              </Button>
              <Button asChild className="bg-[#170f83] hover:bg-[#170f83]/90 text-white">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-[#170f83] hover:text-[#0aacf7] hover:bg-[#170f83]/10">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-[#170f83] hover:bg-[#170f83]/90 text-white">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg"
        >
          <div className="container py-4 flex flex-col gap-4">
            <Link
              href="/events"
              className="px-4 py-2 hover:bg-muted rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Explore Events
            </Link>
            <Link
              href="/features"
              className="px-4 py-2 hover:bg-muted rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 hover:bg-muted rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 hover:bg-muted rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>

            <div className="border-t pt-4 mt-2 space-y-2">
              {session ? (
                <>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/my-events" onClick={() => setIsMobileMenuOpen(false)}>
                      My Events
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-[#170f83] hover:bg-[#170f83]/90 text-white">
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-[#170f83] hover:bg-[#170f83]/90 text-white">
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  )
}
