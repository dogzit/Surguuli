"use client";

import { useTransition } from "react";
import { CalendarCheck2, CalendarClock, HelpCircle, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { setEventRsvp } from "@/app/actions/community";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  description: string;
  type: string;
  rsvpStatus: string | null;
  rsvpCount: number;
}

type Status = "going" | "interested" | "no";

const STATUS_META: Record<Status, { label: string; Icon: typeof CalendarCheck2; className: string; activeClassName: string }> = {
  going: {
    label: "Оролцоно",
    Icon: CalendarCheck2,
    className: "border-border/50 bg-background text-muted-foreground hover:text-foreground",
    activeClassName: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  interested: {
    label: "Магадгүй",
    Icon: HelpCircle,
    className: "border-border/50 bg-background text-muted-foreground hover:text-foreground",
    activeClassName: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  no: {
    label: "Үгүй",
    Icon: X,
    className: "border-border/50 bg-background text-muted-foreground hover:text-foreground",
    activeClassName: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

export function EventsSection({ events }: { events: EventRow[] }) {
  const [pending, start] = useTransition();

  if (events.length === 0) {
    return (
      <Card className="mb-6 border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Ирж буй үйл явдал одоохондоо байхгүй.
        </p>
      </Card>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {events.map((e) => {
        const date = new Date(e.date);
        const dateLabel = date.toLocaleDateString("mn-MN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return (
          <Card key={e.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">{e.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {dateLabel}
                    {e.time && ` · ${e.time}`}
                  </span>
                  {e.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.location}
                    </span>
                  )}
                  <span className="text-muted-foreground/70">
                    {e.rsvpCount} хүн бүртгүүлсэн
                  </span>
                </div>
                {e.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {e.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {(["going", "interested", "no"] as const).map((s) => {
                  const meta = STATUS_META[s];
                  const Icon = meta.Icon;
                  const active = e.rsvpStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        start(async () => {
                          const res = await setEventRsvp(e.id, s);
                          if (res.ok) toast.success(res.message ?? "Хадгалагдлаа");
                          else toast.error(res.error);
                        });
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                        active ? meta.activeClassName : meta.className,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
