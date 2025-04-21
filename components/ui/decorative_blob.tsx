import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface DecorativeBlobProps extends HTMLAttributes<HTMLDivElement> {
  color?: string
}

export function DecorativeBlob({ className, color = "var(--primary)", ...props }: DecorativeBlobProps) {
  return <div className={cn("rounded-full opacity-30 blur-3xl", className)} style={{ background: color }} {...props} />
}
