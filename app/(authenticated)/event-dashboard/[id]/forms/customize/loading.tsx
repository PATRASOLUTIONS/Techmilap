import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Tabs defaultValue="attendee" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendee" disabled>
            Attendee Form
          </TabsTrigger>
          <TabsTrigger value="volunteer" disabled>
            Volunteer Form
          </TabsTrigger>
          <TabsTrigger value="speaker" disabled>
            Speaker Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendee" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
