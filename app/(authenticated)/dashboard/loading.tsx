import Image from "next/image"

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Image
          src="/techmilap-logo-round.png"
          alt="Tech Milap"
          width={80}
          height={80}
          className="mx-auto mb-4 animate-pulse"
        />
        <p className="text-[#170f83]">Loading dashboard...</p>
      </div>
    </div>
  )
}
