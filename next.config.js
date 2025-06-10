/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "https://images.unsplash.com",
      "https://plus.unsplash.com",
      "https://source.unsplash.com",
      "https://localhost",
      "https://placeholder.com",
      "https://picsum.photos",
      "https://loremflickr.com",
      "https://placehold.co",
      "https://placekitten.com",
      "https://dummyimage.com",
      "https://via.placeholder.com",
      "https://res.cloudinary.com",
      "https://cloudinary.com",
      "https://storage.googleapis.com",
      "https://s3.amazonaws.com",
      "https://amazonaws.com",
      "https://img.youtube.com",
      "https://i.imgur.com",
      "https://imgur.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self)",
          },
          {
            key: "Content-Security-Policy",
            value:
              [
                "default-src * 'self' data: blob:", // Consider tightening this by removing '*'
                "script-src * 'self' 'unsafe-inline' 'unsafe-eval'", // Highly permissive, aim to remove '*' and unsafe practices
                "style-src * 'self' 'unsafe-inline'", // Permissive, aim to remove '*' and unsafe-inline
                // Updated img-src:
                "img-src 'self' data: blob: images.unsplash.com plus.unsplash.com source.unsplash.com res.cloudinary.com cloudinary.com storage.googleapis.com s3.amazonaws.com img.youtube.com i.imgur.com localhost placeholder.com picsum.photos loremflickr.com placehold.co placekitten.com dummyimage.com via.placeholder.com",
                "media-src * 'self' data: blob:",
                "connect-src * 'self'", // Permissive
                "font-src * 'self'", // Permissive
                "object-src 'none'",
                "frame-src * 'self'", // Permissive
                "worker-src * 'self' blob:", // Permissive
                "frame-ancestors 'self'",
                "form-action 'self'",
                "base-uri 'self'",
                "manifest-src 'self'",
              ]
                .join("; ")
                .concat(";"), // Ensure the final semicolon
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
