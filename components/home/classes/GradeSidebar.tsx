"use client";

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GradeSidebarProps {
  activeGrade: number;
  onSelect: (grade: number) => void;
}

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export function GradeSidebar({ activeGrade, onSelect }: GradeSidebarProps) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-64">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Ангилал
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">
            Ангиудын жагсаалт
          </div>
        </div>
        <ul className="divide-y divide-border">
          {GRADES.map((grade) => {
            const isActive = grade === activeGrade;
            const isSpecial = grade === 2;
            return (
              <li key={grade}>
                <button
                  type="button"
                  onClick={() => onSelect(grade)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {grade}
                    </span>
                    <div className="leading-tight">
                      <div className="text-sm font-medium">{grade}-р анги</div>
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-widest",
                          isActive ? "text-primary/70" : "text-muted-foreground",
                        )}
                      >
                        {isSpecial ? "Идэвхтэй" : "Битүүмжилсэн"}
                      </div>
                    </div>
                  </div>
                  {isSpecial ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      LIVE
                    </span>
                  ) : (
                    <Lock
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive ? "text-primary/70" : "text-muted-foreground",
                      )}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border bg-muted/40 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          Нийт 12 ангилал · Баталгаажсан
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Хандалт
        </div>
        <div className="mt-1 text-sm font-medium text-foreground">
          Зөвхөн харах горим
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Битүүмжилсэн ангиудын мэдээллийг өөрчлөх эрх нь Захиргааны зөвлөлд
          бүртгэгдсэн.
        </p>
      </Card>
    </aside>
  );
}
