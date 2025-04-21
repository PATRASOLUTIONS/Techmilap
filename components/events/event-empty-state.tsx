import Link from "next/link"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface EventEmptyStateProps {
  title: string
  description: string
  link?: string
  linkText?: string
}

export function EventEmptyState({ title, description, link, linkText }: EventEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      {link && linkText && (
        <CardFooter className="justify-center pb-6">
          <Button asChild>
            <Link href={link}>{linkText}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
