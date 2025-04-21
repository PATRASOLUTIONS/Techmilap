import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AttendeesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Skeleton className="h-10 w-full md:w-[300px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-10 w-full md:w-[180px]" />
      </div>

      <div className="flex space-x-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <th key={i} className="text-left py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-b">
                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <td key={`${row}-${col}`} className="py-3 px-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
