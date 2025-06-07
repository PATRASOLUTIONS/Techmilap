"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Check, ChevronDown, Filter, MapPin, Search, Video, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface EventFiltersProps {
  categories: string[]
  selectedCategory?: string
  selectedFormat?: string
  searchQuery?: string
}

export function EventFilters({
  categories,
  selectedCategory = "all",
  selectedFormat = "all",
  searchQuery = "",
}: EventFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery)
  const [format, setFormat] = useState(selectedFormat)
  const [category, setCategory] = useState(selectedCategory)

  // Update search state when searchQuery prop changes
  useEffect(() => {
    setSearch(searchQuery)
  }, [searchQuery])

  // Update format state when selectedFormat prop changes
  useEffect(() => {
    setFormat(selectedFormat)
  }, [selectedFormat])

  // Update category state when selectedCategory prop changes
  useEffect(() => {
    setCategory(selectedCategory)
  }, [selectedCategory])

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

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    const query = createQueryString({
      category: newCategory === "all" ? null : newCategory,
      search: search ? search : null,
      format: format === "all" ? null : format,
    })
    router.push(`${pathname}?${query}`)
  }

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = createQueryString({
      search: search || null,
      category: category === "all" ? null : category,
      format: format === "all" ? null : format,
    })
    router.push(`${pathname}?${query}`)
  }

  const applyFilters = () => {
    const query = createQueryString({
      search: search || null,
      category: category === "all" ? null : category,
      format: format === "all" ? null : format,
    })
    router.push(`${pathname}?${query}`)
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("all")
    setFormat("all")
    router.push(pathname)
  }

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case "online":
        return <Video className="h-4 w-4 mr-2" />
      case "offline":
        return <MapPin className="h-4 w-4 mr-2" />
      case "hybrid":
        return <Users className="h-4 w-4 mr-2" />
      default:
        return null
    }
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

        {/* <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Events</SheetTitle>
              <SheetDescription>Filter events by format and other criteria</SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <h3 className="text-sm font-medium mb-3">Event Format</h3>
              <RadioGroup value={format} onValueChange={handleFormatChange} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="format-all" />
                  <Label htmlFor="format-all" className="flex items-center">
                    All Formats
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="format-online" />
                  <Label htmlFor="format-online" className="flex items-center">
                    <Video className="h-4 w-4 mr-2 text-blue-500" />
                    Online
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="format-offline" />
                  <Label htmlFor="format-offline" className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-green-500" />
                    In-Person
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="format-hybrid" />
                  <Label htmlFor="format-hybrid" className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    Hybrid
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <SheetFooter className="flex flex-row gap-3 sm:space-x-0">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Clear Filters
              </Button>
              <SheetClose asChild>
                <Button onClick={applyFilters} className="flex-1">
                  Apply Filters
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet> */}
      </div>

      {selectedFormat !== "all" && (
        <div className="flex items-center">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
            {getFormatIcon(selectedFormat)}
            {selectedFormat === "offline"
              ? "In-Person"
              : selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)}
            <button
              onClick={() => {
                setFormat("all")
                const query = createQueryString({
                  search: search || null,
                  category: category === "all" ? null : category,
                  format: null,
                })
                router.push(`${pathname}?${query}`)
              }}
              className="ml-2 text-blue-800 hover:text-blue-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
