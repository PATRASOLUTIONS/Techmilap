"use client"

import { useState, useEffect, useRef } from "react"
import { useInView } from "framer-motion"

interface AnimatedCounterProps {
  from: number
  to: number
  duration?: number
  formatter?: (value: number) => string
}

export function AnimatedCounter({
  from,
  to,
  duration = 2,
  formatter = (value) => Math.floor(value).toLocaleString(),
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const startAnimation = (timestamp: number) => {
      startTime = timestamp
      updateCount(timestamp)
    }

    const updateCount = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const currentCount = from + progress * (to - from)
      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount)
      }
    }

    animationFrame = requestAnimationFrame(startAnimation)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [from, to, duration, isInView])

  return <span ref={ref}>{formatter(count)}</span>
}
