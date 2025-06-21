"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { SpeakerCard } from "@/components/dashboard/speakers/SpeakerCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search } from "lucide-react"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}
interface Socials {
    github?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    instagram?: string | null;
}
interface Speaker {
    id: string;
    name: string;
    profileImage: string | null;
    tagline: string | null;
    jobTitle: string | null;
    email?: string;
    location?: string | null;
    bio?: string | null;
    skills?: string[];
    company?: string | null;
    social?: Socials;
}

interface SpeakerPageContentProps {
    speakers: Speaker[];
}

export function SpeakerPageContent({ speakers }: SpeakerPageContentProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const filteredSpeakers = useMemo(() => {
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        if (!lowercasedQuery) {
            return speakers
        }
        return speakers.filter((speaker) =>
            speaker.name.toLowerCase().includes(lowercasedQuery) ||
            (speaker.tagline && speaker.tagline.toLowerCase().includes(lowercasedQuery)) ||
            (speaker.jobTitle && speaker.jobTitle.toLowerCase().includes(lowercasedQuery)) ||
            (speaker.location && speaker.location.toLowerCase().includes(lowercasedQuery)) ||
            (speaker.company && speaker.company.toLowerCase().includes(lowercasedQuery)) ||
            (speaker.skills && speaker.skills.some(skill => skill.toLowerCase().includes(lowercasedQuery)))
        )
    }, [speakers, debouncedSearchQuery])

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Speakers</h1>
                    <p className="text-muted-foreground">Manage and view all speakers associated with your events.</p>
                </div>
                <div className="relative w-full md:w-auto md:min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search speakers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {speakers.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Speakers Found</AlertTitle>
                    <AlertDescription>
                        There are no speakers currently associated with your approved event submissions. You can invite speakers when creating or managing events.
                    </AlertDescription>
                </Alert>
            ) : filteredSpeakers.length > 0 ? (
                <div className="flex flex-col flex-start gap-6">
                    {filteredSpeakers.map((speaker) => (
                        <div key={speaker.id} className="w-full flex">
                            <SpeakerCard speaker={speaker} />
                        </div>
                    ))}
                </div>
            ) : (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Speakers Found</AlertTitle>
                    <AlertDescription>
                        No speakers match your search criteria. Try a different search term or clear the search field.
                    </AlertDescription>
                </Alert>
            )}
        </>
    )
}