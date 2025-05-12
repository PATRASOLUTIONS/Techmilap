import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, QrCode, Search, BarChart, History } from "lucide-react"

export default function CheckInLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
            <div className="h-5 w-32 bg-muted animate-pulse rounded-md mt-1"></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scan" disabled>
            <QrCode className="h-4 w-4 mr-2" />
            Scan Tickets
          </TabsTrigger>
          <TabsTrigger value="manual" disabled>
            <Search className="h-4 w-4 mr-2" />
            Manual Check-in
          </TabsTrigger>
          <TabsTrigger value="stats" disabled>
            <BarChart className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="history" disabled>
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-48 bg-muted animate-pulse rounded-md"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted animate-pulse rounded-md"></div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-48 bg-muted animate-pulse rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted animate-pulse rounded-md"></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-48 bg-muted animate-pulse rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted animate-pulse rounded-md"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
