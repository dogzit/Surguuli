import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
      </div>

      {/* Primary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5">
            <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-8 rounded-2xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-14" />
        </div>
        <Skeleton className="mb-4 h-3 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-4 text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="mx-auto h-6 w-10" />
              <Skeleton className="mx-auto mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity + Quick stats */}
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
