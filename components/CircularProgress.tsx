import { cn } from "@/lib/utils";

interface Props {
  signed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showSubtext?: boolean;
  className?: string;
}

export default function CircularProgress({
  signed,
  total,
  size = 120,
  strokeWidth,
  showSubtext,
  className,
}: Props) {
  const pct = total > 0 ? (signed / total) * 100 : 0;
  const isDone = signed >= total && total > 0;
  const sw = strokeWidth ?? Math.max(4, Math.round(size / 12));
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const isLarge = size >= 100;
  const isMedium = size >= 64 && size < 100;
  const sub = showSubtext ?? size >= 64;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={sw}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-700 ease-out",
            isDone ? "text-emerald-500" : "text-primary",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <div
          className={cn(
            "font-bold tabular-nums",
            isLarge ? "text-4xl" : isMedium ? "text-lg" : "text-[10px]",
            isDone ? "text-emerald-600" : "text-foreground",
          )}
        >
          {Math.round(pct)}%
        </div>
        {sub && (
          <div
            className={cn(
              "mt-1 text-muted-foreground tabular-nums",
              isLarge ? "text-xs" : "text-[10px]",
            )}
          >
            {signed}/{total}
          </div>
        )}
      </div>
    </div>
  );
}
