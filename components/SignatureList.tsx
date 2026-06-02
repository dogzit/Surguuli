import { Check, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignedEntry {
  position: string;
  note: string | null;
  approverName?: string | null;
}

interface Props {
  positions: readonly string[];
  signed: SignedEntry[];
}

export default function SignatureList({ positions, signed }: Props) {
  const map = new Map<string, SignedEntry>();
  signed.forEach((s) => map.set(s.position, s));

  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {positions.map((position) => {
        const entry = map.get(position);
        const isSigned = !!entry;
        return (
          <li
            key={position}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5 transition-colors",
              isSigned
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-border bg-card",
            )}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isSigned
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isSigned ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight">
                {position}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-xs",
                  isSigned ? "text-emerald-700" : "text-muted-foreground",
                )}
              >
                {isSigned ? "Гарын үсэг зурсан" : "Хүлээгдэж байна"}
              </div>
              {entry?.note && (
                <div className="mt-2 flex items-start gap-1.5 rounded-md border border-emerald-200/70 bg-white px-2 py-1.5 text-xs text-foreground">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                  <span className="leading-relaxed">{entry.note}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
