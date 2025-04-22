"use client"

import { TabsContent } from "@/components/ui/tabs"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

interface CustomQuestionsFormProps {
  data?: { attendee: any[]; volunteer: any[]; speaker: any[] }
  updateData: (data: any) => void
  eventId?: string | null
  updateFormStatus?: (formType: string, status: string) => void
}

export function CustomQuestionsForm({
  data = { attendee: [], volunteer: [], speaker: [] },
  updateData,
  eventId = null,
  updateFormStatus = null,
}: CustomQuestionsFormProps) {
  const [activeTab, setActiveTab] = useState<"attendee" | "volunteer" | "speaker">("attendee")
  const { toast } = useToast()

  const [attendeeQuestions, setAttendeeQuestions] = useState<any[]>([])
  const [volunteerQuestions, setVolunteerQuestions] = useState<any[]>([])
  const [speakerQuestions, setSpeakerQuestions] = useState<any[]>([])

  const [publishStatus, setPublishStatus] = useState({
    attendee: false,
    volunteer: false,
    speaker: false,
  })

  useEffect(() => {
    setAttendeeQuestions(data?.attendee || [])
    setVolunteerQuestions(data?.volunteer || [])
    setSpeakerQuestions(data?.speaker || [])
  }, [data])

  useEffect(() => {
    updateData({
      attendee: attendeeQuestions,
      volunteer: volunteerQuestions,
      speaker: speakerQuestions,
    })
  }, [attendeeQuestions, volunteerQuestions, speakerQuestions, updateData])

  const addQuestion = useCallback(
    (type: "attendee" | "volunteer" | "speaker") => {
      const newQuestion = {
        id: `question_${Date.now()}`,
        type: "text",
        label: "",
        placeholder: "",
        required: false,
        options: [],
      }

      if (type === "attendee") {
        setAttendeeQuestions((prev) => [...prev, newQuestion])
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) => [...prev, newQuestion])
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) => [...prev, newQuestion])
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const removeQuestion = useCallback(
    (type: "attendee" | "volunteer" | "speaker", id: string) => {
      if (type === "attendee") {
        setAttendeeQuestions((prev) => prev.filter((q) => q.id !== id))
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) => prev.filter((q) => q.id !== id))
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) => prev.filter((q) => q.id !== id))
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const updateQuestion = useCallback(
    (type: "attendee" | "volunteer" | "speaker", id: string, field: string, value: any) => {
      if (type === "attendee") {
        setAttendeeQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const addOption = useCallback(
    (type: "attendee" | "volunteer" | "speaker", questionId: string) => {
      const newOption = {
        id: `option_${Date.now()}`,
        value: "",
      }

      if (type === "attendee") {
        setAttendeeQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), newOption] } : q)),
        )
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), newOption] } : q)),
        )
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), newOption] } : q)),
        )
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const removeOption = useCallback(
    (type: "attendee" | "volunteer" | "speaker", questionId: string, optionId: string) => {
      if (type === "attendee") {
        setAttendeeQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, options: q.options?.filter((opt) => opt.id !== optionId) } : q,
          ),
        )
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, options: q.options?.filter((opt) => opt.id !== optionId) } : q,
          ),
        )
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, options: q.options?.filter((opt) => opt.id !== optionId) } : q,
          ),
        )
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const updateOption = useCallback(
    (type: "attendee" | "volunteer" | "speaker", questionId: string, optionId: string, value: string) => {
      if (type === "attendee") {
        setAttendeeQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, options: q.options?.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)) }
              : q,
          ),
        )
      } else if (type === "volunteer") {
        setVolunteerQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, options: q.options?.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)) }
              : q,
          ),
        )
      } else if (type === "speaker") {
        setSpeakerQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, options: q.options?.map((opt) => (opt.id === optionId ? { ...opt, value } : opt)) }
              : q,
          ),
        )
      }
    },
    [setAttendeeQuestions, setVolunteerQuestions, setSpeakerQuestions],
  )

  const handleOnDragEnd = (result: DropResult, type: string) => {
    if (!result.destination) return

    const items =
      type === "attendee"
        ? [...attendeeQuestions]
        : type === "volunteer"
          ? [...volunteerQuestions]
          : [...speakerQuestions]
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    if (type === "attendee") {
      setAttendeeQuestions(items)
    } else if (type === "volunteer") {
      setVolunteerQuestions(items)
    } else {
      setSpeakerQuestions(items)
    }
  }

  const renderQuestionFields = (question: any, type: string, index: number) => {
    if (!question) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${question.id}-label`}>Question Label</Label>
            <Input
              id={`${question.id}-label`}
              value={question.label || ""}
              onChange={(e) => updateQuestion(type, question.id, "label", e.target.value)}
              placeholder="Enter question label"
            />
          </div>
          <div>
            <Label htmlFor={`${question.id}-type`}>Question Type</Label>
            <Select
              value={question.type || "text"}
              onValueChange={(value) => updateQuestion(type, question.id, "type", value)}
            >
              <SelectTrigger id={`${question.id}-type`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="radio">Radio Buttons</SelectItem>
                <SelectItem value="checkbox">Checkboxes</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor={`${question.id}-placeholder`}>Placeholder Text</Label>
          <Input
            id={`${question.id}-placeholder`}
            value={question.placeholder || ""}
            onChange={(e) => updateQuestion(type, question.id, "placeholder", e.target.value)}
            placeholder="Enter placeholder text"
          />
        </div>

        {["select", "radio", "checkbox"].includes(question.type) && (
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {Array.isArray(question.options) &&
                question.options.map((option, optIndex) => (
                  <div key={option.id || `option-${optIndex}`} className="flex items-center space-x-2">
                    <Input
                      value={option.value || ""}
                      onChange={(e) => updateOption(type, question.id, option.id, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(type, question.id, option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(type, question.id)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id={`${question.id}-required`}
            checked={question.required || false}
            onCheckedChange={(checked) => updateQuestion(type, question.id, "required", checked)}
          />
          <Label htmlFor={`${question.id}-required`}>Required</Label>
        </div>
      </div>
    )
  }

  const renderFormCard = (
    type: "attendee" | "volunteer" | "speaker",
    title: string,
    description: string,
    questions: any[],
    setQuestions: (questions: any[]) => void,
  ) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext
            onDragEnd={(result) => {
              handleOnDragEnd(result, type)
            }}
          >
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="border rounded-lg p-4 relative mb-4"
                        >
                          <div className="absolute right-2 top-2 flex space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(type, question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="cursor-move">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="mb-2 font-medium">Question {index + 1}</div>
                          {renderQuestionFields(question, type, index)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Button type="button" onClick={() => addQuestion(type)} className="mt-4 w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="attendee" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="attendee">Attendee Form</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer Form</TabsTrigger>
          <TabsTrigger value="speaker">Speaker Form</TabsTrigger>
        </TabsList>
        <TabsContent value="attendee">
          {renderFormCard(
            "attendee",
            "Attendee Form Questions",
            "Customize the questions for attendees registering for your event",
            attendeeQuestions,
            setAttendeeQuestions,
          )}
        </TabsContent>
        <TabsContent value="volunteer">
          {renderFormCard(
            "volunteer",
            "Volunteer Form Questions",
            "Customize the questions for volunteers applying to your event",
            volunteerQuestions,
            setVolunteerQuestions,
          )}
        </TabsContent>
        <TabsContent value="speaker">
          {renderFormCard(
            "speaker",
            "Speaker Form Questions",
            "Customize the questions for speakers applying to your event",
            speakerQuestions,
            setSpeakerQuestions,
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
