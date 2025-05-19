export default function EventsLoading() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="mb-6">
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
          <div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
