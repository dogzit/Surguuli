import { Skeleton } from "@/components/ui/skeleton";

export default function BulkLoading() {
  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
      </div>
      <div className="mb-6 rounded-2xl border border-border/50 bg-card p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-1 h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="mb-6 h-16 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card">
            <Skeleton className="h-12 rounded-t-xl" />
            <div className="p-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />
              <Skeleton className="mt-4 h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
