// Shown instantly while a page loads its data on the server.
// Each page folder has a loading.tsx that re-exports this, which gives every
// page its own <Suspense> boundary. Without it, clicking a link in the sidebar
// waits on the server with no feedback, so the app feels stuck.
export default function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="mb-6 border-b pb-4">
        <div className="h-7 w-56 bg-muted" />
        <div className="mt-2 h-4 w-40 bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-48 border bg-muted/40" />
        <div className="h-48 border bg-muted/40" />
      </div>
    </div>
  );
}
