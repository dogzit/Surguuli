import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Palette per accent name — matches the sidebar's icon tints so hero and
// nav feel like one system rather than two disconnected styles.
const ACCENT: Record<string, { tint: string; iconGrad: string; ring: string; chip: string }> = {
  violet: {
    tint: "from-violet-500/[0.07] via-violet-500/[0.02] to-transparent",
    iconGrad: "from-violet-500/25 to-violet-500/5 text-violet-500",
    ring: "ring-violet-500/20",
    chip: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  pink: {
    tint: "from-pink-500/[0.07] via-pink-500/[0.02] to-transparent",
    iconGrad: "from-pink-500/25 to-pink-500/5 text-pink-500",
    ring: "ring-pink-500/20",
    chip: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
  },
  amber: {
    tint: "from-amber-500/[0.07] via-amber-500/[0.02] to-transparent",
    iconGrad: "from-amber-500/25 to-amber-500/5 text-amber-500",
    ring: "ring-amber-500/20",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  indigo: {
    tint: "from-indigo-500/[0.07] via-indigo-500/[0.02] to-transparent",
    iconGrad: "from-indigo-500/25 to-indigo-500/5 text-indigo-500",
    ring: "ring-indigo-500/20",
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  },
  emerald: {
    tint: "from-emerald-500/[0.07] via-emerald-500/[0.02] to-transparent",
    iconGrad: "from-emerald-500/25 to-emerald-500/5 text-emerald-500",
    ring: "ring-emerald-500/20",
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  cyan: {
    tint: "from-cyan-500/[0.07] via-cyan-500/[0.02] to-transparent",
    iconGrad: "from-cyan-500/25 to-cyan-500/5 text-cyan-500",
    ring: "ring-cyan-500/20",
    chip: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  },
};

export type PageHeroAccent = keyof typeof ACCENT;

export interface PageHeroStat {
  label: string;
  value: number | string;
  tone?: "default" | "muted" | "accent";
}

export function PageHero({
  icon: Icon,
  title,
  subtitle,
  accent = "violet",
  stats,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent?: PageHeroAccent;
  stats?: PageHeroStat[];
}) {
  const palette = ACCENT[accent] ?? ACCENT.violet!;

  return (
    <section
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-card",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_1px_2px_-1px_rgba(0,0,0,0.04)]",
      )}
    >
      {/* Soft accent wash — kept low-opacity so the whole panel still reads
          as neutral card, matching the rest of the admin. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          palette.tint,
        )}
      />
      {/* Subtle grid pattern for texture (matches the sidebar-driven aesthetic
          without shouting). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,theme(colors.border/0.6)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/0.6)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={cn(
              "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1",
              palette.iconGrad,
              palette.ring,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {stats.map((s) => {
              const tone = s.tone ?? "default";
              return (
                <div
                  key={`${s.label}-${s.value}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 backdrop-blur-sm",
                    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-none",
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-sm font-bold tabular-nums",
                      tone === "accent"
                        ? palette.chip
                        : tone === "muted"
                          ? "bg-muted text-muted-foreground"
                          : "text-foreground",
                    )}
                  >
                    {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
