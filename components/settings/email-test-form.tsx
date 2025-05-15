"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function EmailTestForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    to: "",
    subject: "Test Email from TechMilap",
    text: "This is a test email sent from the TechMilap platform.",
    html: "<h1>Test Email</h1><p>This is a test email sent from the <strong>TechMilap</strong> platform.</p>",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const verifyConnection = async () => {
    try {
      setVerifying(true)
      const response = await fetch("/api/email/test", {
        method: "GET",
      })

      const data = await response.json()
      setVerificationResult(data)

      if (data.success) {
        toast({
          title: "SMTP Connection Verified",
          description: "Your email configuration is working correctly.",
          variant: "default",
        })
      } else {
        toast({
          title: "SMTP Verification Failed",
          description: data.error || "Could not verify SMTP connection.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.to) {
      toast({
        title: "Missing Recipient",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Email was sent to ${formData.to}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Failed to Send Email",
          description: data.error || "Could not send the email.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Email Testing</CardTitle>
        <CardDescription>
          Test your email configuration by sending a test email or verifying SMTP connection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">SMTP Configuration</h3>
            <p className="text-sm text-muted-foreground">Using environment variables for Gmail SMTP</p>
          </div>
          <Button variant="outline" onClick={verifyConnection} disabled={verifying}>
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Connection"
            )}
          </Button>
        </div>

        {verificationResult && (
          <div
            className={`p-4 mb-6 rounded-md ${verificationResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-start">
              {verificationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-medium">
                  {verificationResult.success ? "Connection Successful" : "Connection Failed"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {verificationResult.success
                    ? "Your SMTP configuration is working correctly."
                    : `Error: ${verificationResult.error || "Unknown error"}`}
                </p>
                {verificationResult.success && verificationResult.config && (
                  <div className="mt-2 text-xs">
                    <p>Host: {verificationResult.config.host}</p>
                    <p>Port: {verificationResult.config.port}</p>
                    <p>Secure: {verificationResult.config.secure ? "Yes" : "No"}</p>
                    <p>User: {verificationResult.config.user}</p>
                    <p>Password: {verificationResult.config.passwordConfigured ? "••••••••" : "Not configured"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={sendTestEmail}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Recipient Email</Label>
              <Input
                id="to"
                name="to"
                type="email"
                placeholder="recipient@example.com"
                value={formData.to}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Plain Text</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="text">Message (Plain Text)</Label>
                <Textarea id="text" name="text" rows={6} value={formData.text} onChange={handleChange} />
              </TabsContent>
              <TabsContent value="html" className="space-y-2">
                <Label htmlFor="html">Message (HTML)</Label>
                <Textarea id="html" name="html" rows={6} value={formData.html} onChange={handleChange} />
              </TabsContent>
            </Tabs>
          </div>

          <CardFooter className="flex justify-end px-0 pt-6">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}
