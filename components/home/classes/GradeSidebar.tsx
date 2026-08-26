"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradeSidebarProps {
  activeGrade: number;
  onSelect: (grade: number) => void;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
const ACTIVE_GRADES = new Set([2]);

export function GradeSidebar({ activeGrade, onSelect }: GradeSidebarProps) {
  return (
    <aside className="lg:w-52 lg:flex-shrink-0">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Ангилал
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {GRADES.map((grade) => {
          const isActive = grade === activeGrade;
          const isLocked = !ACTIVE_GRADES.has(grade);
          return (
            <button
              key={grade}
              type="button"
              disabled={isLocked}
              onClick={() => !isLocked && onSelect(grade)}
              className={cn(
                "flex-shrink-0 rounded-lg border px-3.5 py-2 text-sm font-medium tabular-nums transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isLocked
                    ? "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {grade}
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical list */}
      <ul className="mt-3 hidden space-y-0.5 lg:block">
        {GRADES.map((grade) => {
          const isActive = grade === activeGrade;
          const isLocked = !ACTIVE_GRADES.has(grade);
          return (
            <li key={grade}>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onSelect(grade)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isLocked
                      ? "cursor-not-allowed text-muted-foreground/40 hover:bg-muted/30"
                      : "text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-baseline gap-1.5">
                  <span className="tabular-nums font-medium">{grade}</span>
                  <span
                    className={cn(
                      "text-xs",
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    -р анги
                  </span>
                </span>
                {isLocked ? (
                  <Lock
                    className={cn(
                      "h-3 w-3",
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/30",
                    )}
                  />
                ) : (
                  <span
                    aria-label="Идэвхтэй"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isActive ? "bg-primary-foreground" : "bg-emerald-500",
                    )}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 hidden text-xs leading-relaxed text-muted-foreground lg:block">
        Одоогоор 2-р ангийн сурагчдын дэлгэрэнгүй нээлттэй байна.
      </p>
    </aside>
  );
}
