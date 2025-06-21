import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div>
        {/* Skeleton for page title and description */}
        <Skeleton className="h-9 w-48 rounded-md" /> {/* Approx size of "Profile" h1 */}
        <Skeleton className="mt-2 h-5 w-96 rounded-md" /> {/* Approx size of description p */}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-64 rounded-md" /> {/* CardTitle "Personal Information" */}
          <Skeleton className="mt-1 h-5 w-full max-w-md rounded-md" /> {/* CardDescription */}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skeleton for form fields - example for a few fields */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4 rounded-md" /> {/* Label for a potentially larger field like bio */}
            <Skeleton className="h-24 w-full rounded-md" /> {/* Textarea (e.g. bio) */}
          </div>

          {/* Skeleton for a button */}
          <Skeleton className="h-10 w-32 rounded-md mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}