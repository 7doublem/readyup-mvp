// Global crash handler
// Wraps the entire app. If any component throws during rendering, this
// catches the error and shows a branded "System Malfunction" screen with
// a Reload button instead of a blank white page.

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

// Fallback UI shown when the app crashes unexpectedly
function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
      <h1
        className="text-3xl sm:text-4xl font-black text-white uppercase tracking-widest mb-4"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        System <span className="text-red-500">Malfunction</span>
      </h1>
      <p className="text-gray-400 text-sm mb-6 max-w-md">
        Something went wrong. The issue has been logged. Please reload and try again.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-lg bg-red-500 px-8 py-3 text-sm font-semibold text-white hover:bg-red-400 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Reload the application"
      >
        Reload
      </button>
    </main>
  );
}

export default function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, info) => {
        console.error("ErrorBoundary caught:", error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
