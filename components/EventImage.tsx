"use client";
import Image from "next/image";
import { handleImageError } from "@/lib/image-utils"


export default function EventImage(props: React.ComponentProps<typeof Image>) {
    const fallbackImageUrl = "/vibrant-tech-event.png"

    return <Image {...props} onError={(e) => handleImageError(e, fallbackImageUrl)}
    />;
}