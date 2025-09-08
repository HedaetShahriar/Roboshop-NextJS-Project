export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
      <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="w-full aspect-[4/3] bg-gray-200 rounded animate-pulse" />
          <div>
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse mb-4" />
            <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse mb-6" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
            <div className="h-10 bg-gray-200 rounded mt-6 w-full md:w-40 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
