import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ClassesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
      <div className="max-w-2xl">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>
      <div className="mt-8">
        <div className="mb-6 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col gap-2 lg:w-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-5 w-16" />
                    <Skeleton className="mt-2 h-2 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
