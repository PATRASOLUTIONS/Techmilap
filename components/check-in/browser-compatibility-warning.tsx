import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function BrowserCompatibilityWarning() {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Camera Access Not Supported</AlertTitle>
      <AlertDescription>
        <p>Your browser doesn't support camera access or it's disabled.</p>
        <p className="mt-2">Please try:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Using a modern browser like Chrome, Firefox, or Edge</li>
          <li>Ensuring you're using HTTPS (secure connection)</li>
          <li>Checking your browser settings to allow camera access</li>
          <li>Using the manual check-in option instead</li>
        </ul>
      </AlertDescription>
    </Alert>
  )
}
