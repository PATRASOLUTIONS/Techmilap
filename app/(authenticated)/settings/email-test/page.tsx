import { EmailTestForm } from "@/components/settings/email-test-form"

export default function EmailTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Email Testing</h1>
      <p className="text-muted-foreground mb-8">
        Test your Gmail SMTP configuration by sending test emails or verifying the connection.
      </p>

      <EmailTestForm />
    </div>
  )
}
