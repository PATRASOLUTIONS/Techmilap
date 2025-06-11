"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface EventFilterControlsProps {
  categories?: string[];
}

export function EventFilterControls({
  categories,
}: EventFilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "all";

  // State for the search input to make it controlled
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Effect to update searchValue if the URL search param changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);



  const handleCategoryChange = (newCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory && newCategory !== "all") {
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }
    params.delete("page"); // Reset to page 1 when filters change
    router.push(`/events?${params.toString()}`);
  };

  // Function to update URL based on search term
  const updateSearchQuery = (newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    console.log("Updating search with:", newSearch);
    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to page 1
    router.push(`/events?${params.toString()}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The searchValue state is the source of truth
    updateSearchQuery(searchValue);
  };

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = event.target.value;
    setSearchValue(newSearchValue);
    // If the input is cleared, immediately update the search query
    if (newSearchValue === "") {
      updateSearchQuery("");
    }
  };

  return (
    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
      <form className="flex-1 min-w-[200px]" onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Search events..."
            className="pl-8"
            value={searchValue} // Controlled component
            onChange={handleSearchInputChange} // Handle changes, including clearing
            aria-label="Search events"
          />
        </div>
      </form>

      <div className="flex-1 min-w-[150px]">
        <Select value={currentCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger aria-label="Filter by category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}