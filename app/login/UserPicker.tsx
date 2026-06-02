"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Briefcase, GraduationCap, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";
import { loginAs } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type User = { id: string; name: string; position: string; role: string };

interface Props {
  teachers: User[];
  approvers: User[];
}

export default function UserPicker({ teachers, approvers }: Props) {
  const [tab, setTab] = useState<"approver" | "teacher">("approver");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const users = tab === "teacher" ? teachers : approvers;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.position.toLowerCase().includes(needle),
    );
  }, [users, q]);

  useEffect(() => {
    if (!selected) return;
    setPin("");
    setError("");
  }, [selected]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError("");
    start(async () => {
      const fd = new FormData();
      fd.append("userId", selected.id);
      fd.append("pin", pin);
      const result = await loginAs(fd);
      if (result && "error" in result) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "approver" | "teacher")}>
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="approver">
            <Briefcase className="h-4 w-4" />
            Гарын үсэг зурагч
            <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
              {approvers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="teacher">
            <GraduationCap className="h-4 w-4" />
            Багш
            <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
              {teachers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Нэр эсвэл албан тушаалаар хайх..."
            className="pl-9"
          />
        </div>

        <TabsContent value="approver" className="mt-0">
          <UserGrid users={filtered} onPick={setSelected} />
        </TabsContent>
        <TabsContent value="teacher" className="mt-0">
          <UserGrid users={filtered} onPick={setSelected} />
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center self-start rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <DialogTitle>{selected?.name}</DialogTitle>
              <DialogDescription>{selected?.position}</DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-2">
              <Label htmlFor="pin">PIN код</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError("");
                }}
                maxLength={6}
                placeholder="••••"
                className={cn(
                  "h-11 text-center text-lg tracking-[0.5em]",
                  error && "border-destructive focus-visible:ring-destructive",
                )}
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelected(null)}
                disabled={pending}
              >
                Болих
              </Button>
              <Button type="submit" disabled={pending || pin.length === 0}>
                {pending ? "Шалгаж байна..." : "Нэвтрэх"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserGrid({
  users,
  onPick,
}: {
  users: User[];
  onPick: (u: User) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        Олдсонгүй
      </div>
    );
  }
  return (
    <div className="grid max-h-[520px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onPick(u)}
          className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all hover:cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/50 hover:shadow active:scale-[0.99]"
        >
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{u.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {u.position}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
