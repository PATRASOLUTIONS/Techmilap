"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EventFiltersProps {
  categories: string[]
  selectedCategory?: string
  searchQuery?: string
}

export function EventFilters({ categories, selectedCategory = "all", searchQuery = "" }: EventFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)

  // Update search state when searchQuery prop changes
  useEffect(() => {
    setSearch(searchQuery)
  }, [searchQuery])

  const createQueryString = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })

    return newSearchParams.toString()
  }

  const handleCategoryChange = (category: string) => {
    const query = createQueryString({
      category: category === "all" ? null : category,
      search: search ? search : null,
    })
    router.push(`${pathname}?${query}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = createQueryString({
      search: search || null,
      category: selectedCategory === "all" ? null : selectedCategory,
    })
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between min-w-[150px]">
              {selectedCategory === "all" ? "All Categories" : selectedCategory}
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleCategoryChange("all")}>
              <Check className={`mr-2 h-4 w-4 ${selectedCategory === "all" ? "opacity-100" : "opacity-0"}`} />
              All Categories
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem key={category} onClick={() => handleCategoryChange(category)}>
                <Check className={`mr-2 h-4 w-4 ${selectedCategory === category ? "opacity-100" : "opacity-0"}`} />
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
