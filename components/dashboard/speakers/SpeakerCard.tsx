"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MapPinIcon, Tag, Building2, Github, Linkedin, Twitter, Facebook } from "lucide-react"
import CustomInstagramIcon from "@/components/ui/CustomInstagramIcon" // Import the new custom icon

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

interface SpeakerCardProps {
    speaker: Speaker;
}

// Helper function to get initials from name (can be moved to a utils file if used elsewhere)
const getInitials = (name: string = "") => {
    if (!name || typeof name !== 'string') return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase();
};

export function SpeakerCard({ speaker }: SpeakerCardProps) {
    return (
        <Card key={speaker.id} className="overflow-hidden flex flex-col justify-between w-full max-w-[700px] border-secondary-foreground/10">
            <CardHeader className="pb-3">
                <div className="flex items-start space-x-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarImage src={speaker.profileImage ?? undefined} alt={speaker.name} />
                        <AvatarFallback className="text-2xl">{getInitials(speaker.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 mt-3">
                        <div className="flex items-center justify-between">
                            <Link href={`/dashboard/speakers/${speaker.id}`} legacyBehavior passHref>
                                <a className="font-semibold text-lg hover:underline text-foreground">{speaker.name}</a>
                            </Link>
                            <div className="flex items-center gap-2">
                                {speaker.social?.twitter && (
                                    <a href={speaker.social.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                                        <Twitter className="h-5 w-5" />
                                    </a>
                                )}
                                {speaker.social?.github && (
                                    <a href={speaker.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-50">
                                        <Github className="h-5 w-5" />
                                    </a>
                                )}
                                {speaker.social?.linkedin && (
                                    <a href={speaker.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                                        <Linkedin className="h-5 w-5" />
                                    </a>
                                )}
                                {speaker.social?.facebook && (
                                    <a href={speaker.social.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                        <Facebook className="h-5 w-5" />
                                    </a>
                                )}
                                {speaker.social?.instagram && (
                                    <a href={speaker.social.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 flex items-center justify-center">
                                        <CustomInstagramIcon className="h-5 w-5" />
                                    </a>
                                )} 
                            </div>
                        </div>
                        {(speaker.tagline || speaker.jobTitle) && (
                            <p className="text-sm text-muted-foreground leading-tight mt-1 line-clamp-2">{speaker.tagline || speaker.jobTitle}</p>
                        )}
                        {speaker.company && (
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span>{speaker.company}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="py-3 space-y-3 flex-grow">
                {speaker.location && (
                    <div className="flex items-start text-sm text-muted-foreground">
                        <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{speaker.location}</span>
                    </div>
                )}
                {speaker.bio && (
                    <div className="flex items-start text-sm text-muted-foreground">
                        <p className="line-clamp-3">{speaker.bio}</p>
                    </div>
                )}
                {speaker.skills && speaker.skills.length > 0 && (
                    <div>
                        <div className="flex items-center text-sm font-medium mb-1">
                            <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                            Topics
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {speaker.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-2 mt-auto">
                <Link href={`/dashboard/speakers/${speaker.id}`} legacyBehavior passHref>
                    <Button variant="ghost" size="sm" as="a">
                        View Profile
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}