/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "mongodb"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'mongodb', 'mongoose', etc. on the client to prevent errors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        mongodb: false,
        mongoose: false,
        "mongodb-client-encryption": false,
        aws4: false,
        "mongodb-client-encryption": false,
        kerberos: false,
        "supports-color": false,
        "mongodb-client-encryption": false,
        snappy: false,
        "@mongodb-js/zstd": false,
        "@aws-sdk/credential-providers": false,
        fs: false,
        net: false,
        tls: false,
        "util/types": false,
      }
    }
    return config
  },
}

module.exports = nextConfig
