import type React from "react"
import { cn } from "@/lib/utils"

interface GradientCardProps {
  children: React.ReactNode
  className?: string
  gradientFrom?: string
  gradientTo?: string
}

export function GradientCard({
  children,
  className,
  gradientFrom = "from-primary/5",
  gradientTo = "to-secondary/10",
}: GradientCardProps) {
  return (
    <div className={cn("p-[1px] rounded-lg overflow-hidden bg-gradient-to-br", gradientFrom, gradientTo, className)}>
      {children}
    </div>
  )
}
