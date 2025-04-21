interface SectionHeadingProps {
  title: string
  subtitle?: string
  description?: string
  alignment?: "left" | "center"
}

export function SectionHeading({ title, subtitle, description, alignment = "center" }: SectionHeadingProps) {
  return (
    <div className={`space-y-4 ${alignment === "center" ? "text-center mx-auto" : ""}`}>
      {subtitle && <p className="text-primary font-medium">{subtitle}</p>}
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
      {description && (
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
