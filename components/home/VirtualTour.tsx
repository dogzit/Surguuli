"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  BookOpen,
  Library,
  Activity,
  UtensilsCrossed,
  Trees,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SectionShell } from "./SectionShell";
import type { TourRoomRow } from "@/lib/site-data";

const PanoramaViewer = dynamic(() => import("./PanoramaViewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
  ),
});

const ICON_MAP: Record<string, typeof DoorOpen> = {
  DoorOpen,
  BookOpen,
  Library,
  Activity,
  UtensilsCrossed,
  Trees,
  MapPin,
};

export function VirtualTour({ rooms }: { rooms: TourRoomRow[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = rooms[activeIdx] ?? rooms[0];
  const Icon = ICON_MAP[active?.icon] ?? DoorOpen;

  function goto(delta: number) {
    setActiveIdx((i) => (i + delta + rooms.length) % rooms.length);
  }

  if (rooms.length === 0) {
    return (
      <SectionShell
        id="tour"
        tone="light"
        eyebrow="Виртуал аялал"
        title="Сургуулийг өөрөө нэг зочилж үзээрэй"
      >
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
          Виртуал аялалын мэдээлэл байхгүй байна
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      id="tour"
      tone="light"
      eyebrow="Виртуал аялал"
      title="Сургуулийг өөрөө нэг зочилж үзээрэй"
      description="360° панорамик зураг ашиглан сургуулийг бүрнэ нь танилцаарай."
    >
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* 360° Viewer */}
        <Card className="overflow-hidden p-0">
          <PanoramaViewer
            panoramaUrl={active?.panoramaUrl}
            title={`${active?.label} — ${active?.subtitle}`}
          />

          {/* Room info */}
          <div className="border-t border-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{active?.label}</div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {active?.subtitle}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goto(-1)}
                  aria-label="Өмнөх"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-accent"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {activeIdx + 1}/{rooms.length}
                </span>
                <button
                  type="button"
                  onClick={() => goto(1)}
                  aria-label="Дараах"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-accent"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {active?.description}
            </p>

            <dl className="mt-4 flex flex-wrap gap-2">
              {active?.facts.map((f) => (
                <div
                  key={f.key}
                  className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {f.key}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground tabular-nums">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>

        {/* Room list sidebar */}
        <ol className="grid gap-2 self-start">
          {rooms.map((room, idx) => {
            const isActive = idx === activeIdx;
            const RowIcon = ICON_MAP[room.icon] ?? DoorOpen;
            return (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition",
                    isActive
                      ? "border-primary/40 bg-primary/[0.06]"
                      : "border-border bg-background hover:border-primary/20 hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md transition",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <RowIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {room.label}
                    </div>
                    <div className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
                      {room.subtitle}
                    </div>
                  </div>
                  {room.panoramaUrl && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      360°
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </SectionShell>
  );
}
