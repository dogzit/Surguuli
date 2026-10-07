"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Link2, Loader2, MapPin, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteLate, recordLate, searchStudents, type StudentMatch } from "@/app/actions/lateness";
import { MAX_MINUTES_LATE, MINUTE_PRESETS, addDays } from "@/lib/lateness";
import { minutesTone } from "./minutes-tone";
import { cn } from "@/lib/utils";

export interface DutyRecord {
  id: string;
  studentName: string;
  classLabel: string;
  minutesLate: number;
  comesFrom: string;
  recordedByName: string;
  createdAt: string;
  canDelete: boolean;
}

const timeFmt = new Intl.DateTimeFormat("mn-MN", {
  timeZone: "Asia/Ulaanbaatar",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function DutyBoard({
  date,
  today,
  records,
  classOptions,
  placeOptions,
}: {
  date: string;
  today: string;
  records: DutyRecord[];
  classOptions: string[];
  placeOptions: string[];
}) {
  const router = useRouter();
  const goTo = (d: string) => router.push(d === today ? "/dashboard/duty" : `/dashboard/duty?date=${d}`);

  const total = records.reduce((s, r) => s + r.minutesLate, 0);
  const avg = records.length > 0 ? Math.round(total / records.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => goTo(addDays(date, -1))} aria-label="Өмнөх өдөр">
          <ChevronLeft />
        </Button>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="w-auto"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => goTo(addDays(date, 1))}
          disabled={date >= today}
          aria-label="Дараагийн өдөр"
        >
          <ChevronRight />
        </Button>
        {date !== today && (
          <Button variant="ghost" size="sm" onClick={() => goTo(today)}>
            Өнөөдөр
          </Button>
        )}
      </div>

      <LateForm key={date} date={date} classOptions={classOptions} placeOptions={placeOptions} />

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">
            {date === today ? "Өнөөдөр хоцорсон" : "Энэ өдөр хоцорсон"}
          </h2>
          {records.length > 0 && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {records.length} сурагч · дундаж {avg} мин
            </span>
          )}
        </div>
        {records.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Бүртгэл алга. Хоцорсон сурагч ирвэл дээрх маягтаар бүртгэнэ үү.
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {records.map((r) => (
                <RecordRow key={r.id} record={r} />
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function LateForm({
  date,
  classOptions,
  placeOptions,
}: {
  date: string;
  classOptions: string[];
  placeOptions: string[];
}) {
  const [name, setName] = useState("");
  const [classLabel, setClassLabel] = useState("");
  const [minutes, setMinutes] = useState("");
  const [comesFrom, setComesFrom] = useState("");
  const [linked, setLinked] = useState<StudentMatch | null>(null);
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const latestQuery = useRef("");

  // Debounced lookup in the student list; only the newest answer is kept.
  useEffect(() => {
    if (linked) return;
    const q = name.trim();
    latestQuery.current = q;
    if (q.length < 2) {
      setMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      const found = await searchStudents(q).catch(() => []);
      if (latestQuery.current === q) {
        setMatches(found);
        setActive(0);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [name, linked]);

  const pick = (m: StudentMatch) => {
    setLinked(m);
    setName(m.name);
    setClassLabel(m.classLabel);
    if (!comesFrom && m.lastComesFrom) setComesFrom(m.lastComesFrom);
    setMatches([]);
    setOpen(false);
  };

  const unlink = () => {
    setLinked(null);
    setClassLabel("");
    nameRef.current?.focus();
  };

  const onNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[active]!);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await recordLate({
        date,
        studentName: name,
        classLabel,
        minutesLate: minutes,
        comesFrom,
        studentId: linked?.id ?? null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message ?? "Бүртгэгдлээ.");
      setName("");
      setClassLabel("");
      setMinutes("");
      setComesFrom("");
      setLinked(null);
      nameRef.current?.focus();
    });
  };

  return (
    <Card className="p-4 sm:p-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div className="relative space-y-1.5">
            <Label htmlFor="late-name">Сурагчийн овог, нэр</Label>
            <Input
              id="late-name"
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setOpen(true);
                if (linked) setLinked(null);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={onNameKey}
              placeholder="Жишээ: Б. Тэмүүлэн"
              autoComplete="off"
              required
              className="h-11 text-base sm:h-9 sm:text-sm"
            />
            {open && matches.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {matches.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(m)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm",
                        i === active ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
                        {m.classLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {linked && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <Link2 className="h-3.5 w-3.5" />
                Сургуулийн бүртгэлтэй сурагч
                <button type="button" onClick={unlink} className="ml-1 rounded p-0.5 hover:bg-accent" aria-label="Холбоосыг салгах">
                  <X className="h-3 w-3" />
                </button>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="late-class">Анги</Label>
            <Input
              id="late-class"
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              list="late-class-options"
              placeholder="5Б"
              autoComplete="off"
              required
              readOnly={!!linked}
              className="h-11 text-base sm:h-9 sm:text-sm"
            />
            <datalist id="late-class-options">
              {classOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="late-minutes">Хэдэн минут хоцорсон</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="late-minutes"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_MINUTES_LATE}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="мин"
              required
              className="h-11 w-24 text-base sm:h-9 sm:text-sm"
            />
            {MINUTE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(String(m))}
                className={cn(
                  "h-9 rounded-full border px-3 text-sm tabular-nums transition",
                  minutes === String(m)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="late-from">Хаанаас ирдэг</Label>
          <Input
            id="late-from"
            value={comesFrom}
            onChange={(e) => setComesFrom(e.target.value)}
            list="late-from-options"
            placeholder="Жишээ: 13-р хороо, Яармаг, дотуур байр"
            autoComplete="off"
            required
            className="h-11 text-base sm:h-9 sm:text-sm"
          />
          <datalist id="late-from-options">
            {placeOptions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <Button type="submit" disabled={pending} className="h-11 w-full sm:h-9 sm:w-auto">
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Бүртгэх
        </Button>
      </form>
    </Card>
  );
}

function RecordRow({ record: r }: { record: DutyRecord }) {
  const [pending, start] = useTransition();

  const remove = () => {
    if (!confirm(`${r.studentName}-ийн бүртгэлийг устгах уу?`)) return;
    start(async () => {
      const res = await deleteLate(r.id);
      if (res.ok) toast.success(res.message ?? "Устгагдлаа.");
      else toast.error(res.error);
    });
  };

  return (
    <li className={cn("flex items-start gap-3 px-4 py-3", pending && "opacity-50")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{r.studentName}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{r.classLabel}</span>
          <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums", minutesTone(r.minutesLate))}>
            {r.minutesLate} мин
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {r.comesFrom}
          </span>
          <span className="tabular-nums">
            {timeFmt.format(new Date(r.createdAt))} · {r.recordedByName}
          </span>
        </div>
      </div>
      {r.canDelete && (
        <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Устгах">
          <Trash2 className="text-muted-foreground" />
        </Button>
      )}
    </li>
  );
}
