"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Алдаа гарлаа
        </h1>
        <p className="text-sm text-muted-foreground">
          Уучлаарай, гэнэтийн алдаа гарсан байна. Дахин оролдоно уу.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/70">
            Алдааны код: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        Дахин оролдох
      </Button>
    </main>
  );
}
