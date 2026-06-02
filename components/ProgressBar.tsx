import { cn } from "@/lib/utils";

interface Props {
  signed: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}

export default function ProgressBar({
  signed,
  total,
  showLabels = true,
  className,
}: Props) {
  const pct = total > 0 ? Math.round((signed / total) * 100) : 0;
  const isDone = signed >= total && total > 0;
  return (
    <div className={cn("w-full", className)}>
      {showLabels && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">
            {signed}/{total}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              isDone ? "text-emerald-600" : "text-foreground",
            )}
          >
            {pct}%
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isDone ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
