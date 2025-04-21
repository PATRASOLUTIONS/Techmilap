"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Save, Edit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface EventCategoriesProps {
  initialCategories?: string[]
  onSave?: (categories: string[]) => void
  readOnly?: boolean
}

export function EventCategories({ initialCategories = [], onSave, readOnly = false }: EventCategoriesProps) {
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [newCategory, setNewCategory] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()]
      setCategories(updatedCategories)
      setNewCategory("")
      if (onSave) onSave(updatedCategories)
    }
  }

  const handleRemoveCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index)
    setCategories(updatedCategories)
    if (onSave) onSave(updatedCategories)
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(categories[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim() && !categories.includes(editValue.trim())) {
      const updatedCategories = [...categories]
      updatedCategories[editingIndex] = editValue.trim()
      setCategories(updatedCategories)
      setEditingIndex(null)
      setEditValue("")
      if (onSave) onSave(updatedCategories)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }

  const getCategoryColor = (category: string) => {
    // Generate a consistent color based on the category name
    const hash = category.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    const colors = [
      "bg-primary/10 text-primary",
      "bg-blue-500/10 text-blue-500",
      "bg-green-500/10 text-green-500",
      "bg-purple-500/10 text-purple-500",
      "bg-amber-500/10 text-amber-500",
      "bg-red-500/10 text-red-500",
      "bg-pink-500/10 text-pink-500",
      "bg-indigo-500/10 text-indigo-500",
    ]

    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Categories</CardTitle>
        <CardDescription>
          {readOnly ? "Browse available event categories" : "Manage categories for organizing events"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="flex space-x-2">
            <Input
              placeholder="New category..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {categories.map((category, index) => (
              <motion.div
                key={`${category}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {editingIndex === index ? (
                  <div className="flex items-center space-x-1 border rounded-full pl-3 pr-1 py-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleSaveEdit()
                        } else if (e.key === "Escape") {
                          handleCancelEdit()
                        }
                      }}
                      className="h-6 text-sm border-none focus-visible:ring-0 p-0 w-24"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className={cn("px-3 py-1 text-sm", getCategoryColor(category))}>
                    {category}
                    {!readOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() => handleStartEdit(index)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 hover:bg-transparent hover:text-destructive"
                          onClick={() => handleRemoveCategory(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {categories.length === 0 && (
            <div className="text-sm text-muted-foreground italic">No categories defined yet.</div>
          )}
        </div>
      </CardContent>
      {!readOnly && (
        <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
          <p>Categories help attendees find events they're interested in.</p>
        </CardFooter>
      )}
    </Card>
  )
}
