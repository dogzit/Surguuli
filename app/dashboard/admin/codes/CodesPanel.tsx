"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  regenerateAllTeacherPins,
  regenerateTeacherPin,
} from "@/app/actions/admin";

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
];

function avatarColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

interface User {
  id: string;
  name: string;
  position: string;
  role: string;
}

interface RevealItem {
  id: string;
  name: string;
  position: string;
  plainPin: string;
}

export default function CodesPanel({ users }: { users: User[] }) {
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [reveal, setReveal] = useState<RevealItem | null>(null);
  const [bulkReveal, setBulkReveal] = useState<RevealItem[] | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmSingle, setConfirmSingle] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.position.toLowerCase().includes(needle),
    );
  }, [q, users]);

  // Close-first UX: the confirm modal is dismissed the moment the user
  // commits, a loading toast tracks progress in the background, and the
  // modal only reappears if the request failed (so the admin can retry
  // without clicking through the card grid again).
  const runSingleReset = (user: User) => {
    setConfirmSingle(null);
    const toastId = toast.loading(`${user.name}-ийн PIN үүсгэж байна...`);
    start(async () => {
      const res = await regenerateTeacherPin(user.id);
      if (!res.ok) {
        toast.error(res.error, { id: toastId });
        setConfirmSingle(user);
        return;
      }
      toast.success(`${res.data!.name}-ийн PIN бэлэн`, { id: toastId });
      setReveal({
        id: user.id,
        name: res.data!.name,
        position: user.position,
        plainPin: res.data!.plainPin,
      });
    });
  };

  const runBulkReset = () => {
    setConfirmBulk(false);
    const toastId = toast.loading(`${users.length} хэрэглэгчийн PIN үүсгэж байна...`);
    start(async () => {
      const res = await regenerateAllTeacherPins();
      if (!res.ok) {
        toast.error(res.error, { id: toastId });
        setConfirmBulk(true);
        return;
      }
      toast.success(res.message ?? "PIN шинэчлэгдлээ.", { id: toastId });
      setBulkReveal(res.data!.items);
    });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Хуулж чадсангүй.");
    }
  };

  return (
    <>
      {/* Header actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Багш хайх..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          variant="destructive"
          onClick={() => setConfirmBulk(true)}
          disabled={pending || users.length === 0}
          className="shrink-0"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Бүгдийг reset хийх
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground print:hidden">
        <span>
          Нийт: <span className="font-semibold text-foreground">{users.length}</span>
        </span>
        <span>
          Харагдаж буй:{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>
        </span>
      </div>

      {/* User grid */}
      {filtered.length === 0 ? (
        <Card className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Багш олдсонгүй
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
          {filtered.map((u) => {
            const color = avatarColor(u.id);
            return (
              <Card
                key={u.id}
                className="flex items-center gap-3 p-4 transition-colors hover:border-primary/30"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                    color,
                  )}
                >
                  {u.name[0] ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {u.name}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {u.position}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmSingle(u)}
                  disabled={pending}
                  className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  title="PIN reset хийх"
                  aria-label={`${u.name}-ийн PIN reset хийх`}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm single reset */}
      <Dialog
        open={!!confirmSingle}
        onOpenChange={(v) => !pending && !v && setConfirmSingle(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              PIN reset хийх үү?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{confirmSingle?.name}</span>
            -ийн одоогийн PIN устгагдаж, шинэ 4 оронтой PIN үүснэ. Шинэ PIN нэг л
            удаа харагдана.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmSingle(null)}
              disabled={pending}
            >
              Цуцлах
            </Button>
            <Button
              onClick={() => {
                if (confirmSingle) runSingleReset(confirmSingle);
                setConfirmSingle(null);
              }}
              disabled={pending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset хийх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal single PIN */}
      <Dialog
        open={!!reveal}
        onOpenChange={(v) => {
          if (!v) setReveal(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <KeyRound className="h-5 w-5 text-emerald-500" />
              </div>
              Шинэ PIN бэлэн боллоо
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Энэ PIN нь энэ цонхыг хаасны дараа <b>дахин харагдахгүй</b>. Одоо
                хуулж авах эсвэл хэвлэнэ үү.
              </span>
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-sm text-muted-foreground">{reveal?.position}</div>
            <div className="text-lg font-semibold">{reveal?.name}</div>
            <div className="mt-3 rounded-2xl border-2 border-primary/40 bg-primary/5 px-6 py-5 font-mono text-4xl font-bold tracking-[0.5em] tabular-nums text-primary">
              {reveal?.plainPin}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setReveal(null)}>
              Хаах
            </Button>
            <Button
              variant="secondary"
              onClick={() => reveal && copy(reveal.plainPin)}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Хууллаа
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Хуулах
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm bulk reset */}
      <Dialog
        open={confirmBulk}
        onOpenChange={(v) => !pending && setConfirmBulk(v)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Бүх PIN-ийг reset хийх үү?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{users.length}</span>{" "}
            хэрэглэгчийн PIN шинээр үүсэж, хуучин PIN-ээр нэвтэрч чадахгүй болно.
            Шинэ PIN-үүд нэг л удаа харагдана — хэвлэж, багш нартаа хүргэх
            хэрэгтэй.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmBulk(false)}
              disabled={pending}
            >
              Цуцлах
            </Button>
            <Button
              variant="destructive"
              onClick={runBulkReset}
              disabled={pending}
            >
              {pending ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Үүсгэж байна...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Бүгдийг reset хийх
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk reveal sheet — printable */}
      <Dialog
        open={!!bulkReveal}
        onOpenChange={(v) => {
          if (!v) setBulkReveal(null);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <KeyRound className="h-5 w-5 text-emerald-500" />
              </div>
              Шинэ PIN-ийн хуудас ({bulkReveal?.length ?? 0})
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 print:hidden dark:text-amber-200">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Энэ хуудсыг хаасны дараа PIN дахин харагдахгүй. Хэвлэж эсвэл
                тэмдэглэж хадгална уу.
              </span>
            </div>
          </div>
          {/* min-h-0 lets this flex child actually shrink below its content
              height so the inner overflow-y-auto has room to scroll. */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-2 sm:grid-cols-2 print:grid-cols-2 print:gap-1">
              {(bulkReveal ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 print:border print:border-gray-300 print:p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {item.position}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-md border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-base font-bold tracking-widest tabular-nums text-primary">
                    {item.plainPin}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end print:hidden">
            <Button variant="outline" onClick={() => setBulkReveal(null)}>
              Хаах
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Хэвлэх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
