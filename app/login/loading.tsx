import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/30 text-primary-foreground shadow-lg">
            <ShieldCheck className="h-8 w-8 opacity-60" />
          </div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-border">
          <div className="border-b px-6 pt-6">
            <div className="grid w-full grid-cols-2 gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="mt-4 mb-6 h-10" />
          </div>
          <div className="space-y-2 px-6 pb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-transparent p-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
