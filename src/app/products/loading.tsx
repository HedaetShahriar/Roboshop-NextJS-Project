export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-10 w-56 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded p-4">
            <div className="w-full aspect-[4/3] bg-gray-200 rounded animate-pulse" />
            <div className="h-5 bg-gray-200 rounded mt-3 w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded mt-2 w-1/2 animate-pulse" />
            <div className="h-9 bg-gray-200 rounded mt-4 w-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
