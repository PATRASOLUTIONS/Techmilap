import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            <Skeleton className="h-8 w-64" />
          </CardTitle>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Loading events...</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
