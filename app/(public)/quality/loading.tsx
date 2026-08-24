import { Skeleton } from "@/components/ui/skeleton";

export default function QualityLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
      <div className="max-w-2xl">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border p-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-48" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-full" />
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-48" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-full" />
        </div>
      </div>
    </div>
  );
}
