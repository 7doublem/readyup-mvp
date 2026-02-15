// Placeholder cards shown while events load
// Displays 6 animated skeleton cards that mimic the event card layout.
// Communicates to the user that content is on its way (better UX than a spinner).

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Loading events">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden animate-pulse"
        >
          {/* Banner placeholder */}
          <div className="w-full h-40 bg-gray-900" />

          {/* Body placeholder */}
          <div className="p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-gray-800 rounded" />
              <div className="h-3 w-16 bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-gray-800 rounded" />
            <div className="h-3 w-full bg-gray-800 rounded" />
            <div className="h-3 w-5/6 bg-gray-800 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-2/3 bg-gray-800 rounded" />
              <div className="h-3 w-1/2 bg-gray-800 rounded" />
              <div className="h-3 w-1/3 bg-gray-800 rounded" />
            </div>
          </div>

          {/* Button placeholder */}
          <div className="px-5 pb-5">
            <div className="h-10 w-full bg-gray-800 rounded-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading events...</span>
    </div>
  );
}
