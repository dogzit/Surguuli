"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Search, AlertCircle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProgressBar from "@/components/ProgressBar";
import { cn, matchesSearch } from "@/lib/utils";

export interface OverviewRow {
  id: string;
  name: string;
  position: string;
  signed: number;
  total: number;
  complete: boolean;
  signedPositions: string[];
  missingPositions: string[];
  lastSignedAt: string | null;
  lastApproverName: string | null;
}

type StatusFilter = "all" | "confirmed" | "in_progress" | "not_started";

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OverviewPanel({ rows }: { rows: OverviewRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status === "confirmed" && !r.complete) return false;
      if (status === "in_progress" && (r.complete || r.signed === 0))
        return false;
      if (status === "not_started" && r.signed !== 0) return false;
      if (!q.trim()) return true;
      const hay = `${r.name} ${r.position}`;
      return matchesSearch(hay, q);
    });
  }, [rows, q, status]);

  const stats = useMemo(() => {
    const confirmed = rows.filter((r) => r.complete).length;
    const notStarted = rows.filter((r) => r.signed === 0).length;
    const inProgress = rows.length - confirmed - notStarted;
    return { confirmed, inProgress, notStarted, total: rows.length };
  }, [rows]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryPill
          label="Нийт багш"
          value={stats.total}
          tone="default"
        />
        <SummaryPill
          label="Баталгаажсан"
          value={stats.confirmed}
          tone="success"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        />
        <SummaryPill
          label="Үргэлжилж буй"
          value={stats.inProgress}
          tone="warning"
          icon={<Clock className="h-3.5 w-3.5" />}
        />
        <SummaryPill
          label="Эхлээгүй"
          value={stats.notStarted}
          tone="muted"
          icon={<AlertCircle className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Багшийн нэр, албан тушаалаар хайх..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="sm:w-56">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            <SelectItem value="confirmed">Баталгаажсан</SelectItem>
            <SelectItem value="in_progress">Үргэлжилж буй</SelectItem>
            <SelectItem value="not_started">Эхлээгүй</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-2 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {rows.length} багш
      </div>

      <div className="space-y-2">
        {filtered.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-xl border bg-card p-4 shadow-sm transition-colors",
              r.complete
                ? "border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5"
                : "border-border hover:bg-muted/30",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{r.name}</h3>
                  <StatusBadge complete={r.complete} signed={r.signed} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.position}
                </p>
              </div>
              <div className="text-right text-xs tabular-nums">
                <div
                  className={cn(
                    "text-2xl font-bold",
                    r.complete
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground",
                  )}
                >
                  {r.signed}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{r.total}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ProgressBar
                signed={r.signed}
                total={r.total}
                showLabels={false}
              />
            </div>

            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-muted-foreground">
                  Зурсан ({r.signedPositions.length})
                </p>
                {r.signedPositions.length === 0 ? (
                  <p className="italic text-muted-foreground/60">
                    Хараахан зураагүй
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {r.signedPositions.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground">
                  Үлдсэн ({r.missingPositions.length})
                </p>
                {r.missingPositions.length === 0 ? (
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Бүх албан тушаалтан зурсан
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {r.missingPositions.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-dashed border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
              <span>
                Сүүлд:{" "}
                <span className="text-foreground tabular-nums">
                  {fmt(r.lastSignedAt)}
                </span>
                {r.lastApproverName && (
                  <span className="ml-1">· {r.lastApproverName}</span>
                )}
              </span>
              {r.complete && (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Амралт баталгаажсан
                </span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Шүүлтэд тохирох багш олдсонгүй
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  complete,
  signed,
}: {
  complete: boolean;
  signed: number;
}) {
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Баталгаажсан
      </span>
    );
  }
  if (signed === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Эхлээгүй
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
      <Clock className="h-3 w-3" />
      Үргэлжилж буй
    </span>
  );
}

function SummaryPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning" | "muted";
  icon?: React.ReactNode;
}) {
  const styles: Record<typeof tone, string> = {
    default:
      "border-border bg-card text-foreground",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    muted:
      "border-border bg-muted/50 text-muted-foreground",
  };
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
        styles[tone],
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
        {icon}
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}
