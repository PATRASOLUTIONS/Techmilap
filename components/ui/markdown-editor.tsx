"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, List, ListOrdered, Heading, Link, ImageIcon, Eye, Edit } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  onToolbarClick?: (tool: string) => void // Add this line
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
  minHeight = "250px",
  onToolbarClick,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("write")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = (markdownSymbol: string, selectionOffset = 0) => {
    const textarea = document.getElementById("markdown-textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let newText = ""
    let newCursorPos = 0

    if (markdownSymbol === "# " || markdownSymbol === "## " || markdownSymbol === "### ") {
      // For headings, add at the beginning of the line
      const beforeSelection = value.substring(0, start)
      const afterSelection = value.substring(end)

      const lineStart = beforeSelection.lastIndexOf("\n") + 1
      const lineEnd = afterSelection.indexOf("\n")
      const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineStart + lineEnd)

      // Remove existing heading markers
      const cleanLine = line.replace(/^#{1,3} /, "")

      newText =
        value.substring(0, lineStart) +
        markdownSymbol +
        cleanLine +
        value.substring(lineEnd === -1 ? value.length : lineStart + lineEnd)
      newCursorPos = lineStart + markdownSymbol.length + cleanLine.length
    } else if (markdownSymbol === "- " || markdownSymbol === "1. ") {
      // For lists, add at the beginning of the line
      const beforeSelection = value.substring(0, start)
      const afterSelection = value.substring(end)

      const lineStart = beforeSelection.lastIndexOf("\n") + 1
      const lineEnd = afterSelection.indexOf("\n")
      const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineStart + lineEnd)

      newText =
        value.substring(0, lineStart) +
        markdownSymbol +
        line +
        value.substring(lineEnd === -1 ? value.length : lineStart + lineEnd)
      newCursorPos = lineStart + markdownSymbol.length + line.length
    } else if (markdownSymbol === "[](url)") {
      // For links
      newText = value.substring(0, start) + "[" + selectedText + "](url)" + value.substring(end)
      newCursorPos = start + selectedText.length + 3
    } else if (markdownSymbol === "![](url)") {
      // For images
      newText = value.substring(0, start) + "![" + (selectedText || "alt text") + "](url)" + value.substring(end)
      newCursorPos = start + selectedText.length + 4
    } else {
      // For bold, italic, etc.
      newText = value.substring(0, start) + markdownSymbol + selectedText + markdownSymbol + value.substring(end)
      newCursorPos = end + 2 * markdownSymbol.length
    }

    onChange(newText)

    // Set focus back to textarea and position cursor
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos - selectionOffset, newCursorPos)
    }, 0)
  }

  const insertText = (text: string, selectedText: string) => {
    if (!textareaRef.current) return value

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd

    const newText = value.substring(0, start) + text + value.substring(end)
    const newCursorPos = start + text.length

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos - selectedText.length, newCursorPos)
      }
    }, 0)

    return newText
  }

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      <div className="bg-muted p-2 border-b flex items-center gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("bold")
            // Existing code for handling bold
            const selection = textareaRef.current?.value.substring(
              textareaRef.current?.selectionStart,
              textareaRef.current?.selectionEnd,
            )
            if (selection) {
              const newText = insertText(`**${selection}**`, selection)
              onChange(newText)
            } else {
              const newText = insertText("**bold text**", "bold text")
              onChange(newText)
            }
          }}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("italic")
            // Existing code for handling italic
            const selection = textareaRef.current?.value.substring(
              textareaRef.current?.selectionStart,
              textareaRef.current?.selectionEnd,
            )
            if (selection) {
              const newText = insertText(`*${selection}*`, selection)
              onChange(newText)
            } else {
              const newText = insertText("*italic text*", "italic text")
              onChange(newText)
            }
          }}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("heading")
            insertMarkdown("# ")
          }}
          title="Heading 1"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("bulletList")
            insertMarkdown("- ")
          }}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("numberedList")
            insertMarkdown("1. ")
          }}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("link")
            insertMarkdown("[](url)", 1)
          }}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onToolbarClick) onToolbarClick("image")
            insertMarkdown("![](url)", 1)
          }}
          title="Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-end px-2 pt-2">
          <TabsList>
            <TabsTrigger value="write" className="flex items-center gap-1">
              <Edit className="h-4 w-4" />
              <span>Write</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="p-0 m-0">
          <Textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ minHeight }}
            ref={textareaRef}
          />
        </TabsContent>

        <TabsContent value="preview" className="p-4 m-0 prose prose-sm max-w-none min-h-[250px] bg-white">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
