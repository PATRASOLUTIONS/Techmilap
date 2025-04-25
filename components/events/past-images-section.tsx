"use client"

import Image from "next/image"

interface PastImagesSectionProps {
  images: string[]
}

export function PastImagesSection({ images }: PastImagesSectionProps) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl font-bold mb-4">Past Images</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-md shadow-md">
              <Image
                src={image || "/placeholder.svg"}
                alt={`Past Event ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
