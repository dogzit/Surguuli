import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionShellProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: "light" | "muted";
}

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = "light",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 border-b border-border/50",
        tone === "muted" ? "bg-muted/30" : "bg-background",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
