import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectionLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
      <div className="max-w-2xl">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border p-4">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-48" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between border-b pb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
