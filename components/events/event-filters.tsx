"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EventFiltersProps {
  categories: string[]
  selectedCategory?: string
}

export function EventFilters({ categories, selectedCategory }: EventFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleCategoryChange = (category?: string) => {
    const params = new URLSearchParams(searchParams)

    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full",
                !selectedCategory && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
              onClick={() => handleCategoryChange()}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full",
                  selectedCategory === category && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
