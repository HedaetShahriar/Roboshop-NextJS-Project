export default function Loading() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative">
        <span
          aria-hidden
          className="absolute -inset-6 rounded-full bg-blue-500/10 blur-xl animate-pulse"
        />
        <div
          role="status"
          aria-label="Loading"
          className="size-16 rounded-full border-4 border-zinc-200 border-t-blue-600 animate-spin motion-reduce:animate-none"
        />
      </div>
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold">Loading Roboshop…</h2>
        <p className="mt-1 text-sm text-zinc-500">Please wait while we get things ready.</p>
      </div>
    </div>
  );
}
