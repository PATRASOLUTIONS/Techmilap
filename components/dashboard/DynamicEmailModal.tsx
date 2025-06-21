"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventOption {
    _id: string;
    title: string;
    date: string;
    location?: string;
}

interface DynamicEmailModalProps {
    email: string;
    name: string;
    type: "speaker" | "volunteer";
}

export default function DynamicEmailModal({ email, name, type }: DynamicEmailModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
    const [events, setEvents] = useState<EventOption[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    // Initialize default subject and content based on type and name
    useEffect(() => {
        if (type === "speaker") {
            setSubject("Invitation to speak at our event");
            setContent(`Dear ${name},\n\nWe would like to invite you to speak at one of our upcoming events. Please let us know your availability.\n\nBest regards,\nEvent Team`);
        } else if (type === "volunteer") {
            setSubject("Invitation to volunteer at our event");
            setContent(`Dear ${name},\n\nWe would like to invite you to volunteer at one of our upcoming events. Please let us know your availability.\n\nBest regards,\nEvent Team`);
        }
    }, [type, name]);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingEvents(true);
            // Fetch upcoming events for current user (event planner)
            fetch("/api/events/my-events")
                .then((res) => res.json())
                .then((data) => {
                    setEvents(data.events || []);
                    if (data.events && data.events.length > 0) {
                        setSelectedEventId(data.events[0]._id || "unknown");
                    }
                })
                .catch(() => {
                    setEvents([]);
                })
                .finally(() => {
                    setIsLoadingEvents(false);
                });
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!selectedEventId) {
            setError("Please select an event.");
            return;
        }
        setIsSending(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("/api/emails/send-to-speaker-volunteer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: email,
                    subject,
                    content,
                    eventId: selectedEventId,
                }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to send email");
            }
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send email");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)}>
                Contact
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Send Email to {name}</DialogTitle>
                        <DialogDescription>
                            Fill in the details below to send an email invitation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                Subject
                            </label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={isSending || success}
                            />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                Content
                            </label>
                            <Textarea
                                id="content"
                                rows={6}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={isSending || success}
                            />
                        </div>
                        <div>
                            <label htmlFor="event" className="block text-sm font-medium text-gray-700">
                                Select Event
                            </label>
                            {isLoadingEvents ? (
                                <div className="flex items-center justify-center py-2">
                                    <svg
                                        className="animate-spin h-5 w-5 text-gray-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        ></path>
                                    </svg>
                                    <span className="ml-2 text-gray-600">Loading events...</span>
                                </div>
                            ) : (
                                <Select
                                    value={selectedEventId}
                                    onValueChange={setSelectedEventId}
                                    disabled={isSending || success}
                                >
                                    <SelectTrigger id="event" className="w-full">
                                        <SelectValue placeholder="Select an event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.length > 0 ? (
                                            events.map((event) => (
                                                <SelectItem key={event._id} value={event._id || "unknown"}>
                                                    {event.title} - {new Date(event.date).toLocaleDateString()}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-events" disabled>
                                                No upcoming events found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        {success && <p className="text-green-600 text-sm">Email sent successfully!</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSend} disabled={isSending || success}>
                            {isSending ? "Sending..." : "Send Email"}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSending}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
