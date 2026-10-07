"use client";

import { useTransition } from "react";
import { CalendarClock, Check, UserPlus, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinClub, leaveClub } from "@/app/actions/community";
import { cn } from "@/lib/utils";

interface ClubRow {
  id: string;
  name: string;
  description: string;
  teacher: string | null;
  schedule: string | null;
  memberCount: number;
  isMember: boolean;
}

export function ClubsSection({ clubs }: { clubs: ClubRow[] }) {
  const [pending, start] = useTransition();

  if (clubs.length === 0) {
    return (
      <Card className="mb-6 border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Одоогоор идэвхтэй дугуйлан бүртгэгдээгүй байна.
        </p>
      </Card>
    );
  }

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2">
      {clubs.map((c) => (
        <Card
          key={c.id}
          className={cn(
            "p-4 transition-all",
            c.isMember && "border-indigo-500/30 bg-indigo-500/[0.03]",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                {c.isMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    <Check className="h-3 w-3" />
                    Гишүүн
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {c.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                {c.teacher && <span>Багш: <span className="text-foreground">{c.teacher}</span></span>}
                {c.schedule && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {c.schedule}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {c.memberCount} гишүүн
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant={c.isMember ? "outline" : "default"}
              disabled={pending}
              onClick={() => {
                start(async () => {
                  const res = c.isMember
                    ? await leaveClub(c.id)
                    : await joinClub(c.id);
                  if (res.ok) toast.success(res.message ?? "");
                  else toast.error(res.error);
                });
              }}
            >
              {c.isMember ? (
                <>
                  <UserMinus className="h-3.5 w-3.5" />
                  Гарах
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Элсэх
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
