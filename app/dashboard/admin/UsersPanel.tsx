"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Pencil, KeyRound, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createUser,
  deleteUser,
  resetUserPin,
  updateUser,
} from "@/app/actions/admin";
import UserDialog from "./UserDialog";

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  position: string;
  role: string;
  signedCount: number;
  receivedCount: number;
}

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Багш",
  APPROVER: "Баталгаажуулагч",
  ADMIN: "Админ",
};

const ROLE_BADGE: Record<string, string> = {
  TEACHER: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  APPROVER: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

const ALL = "__all__";

export default function UsersPanel({
  users,
}: {
  users: AdminUser[];
}) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [pending, start] = useTransition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [pinTarget, setPinTarget] = useState<AdminUser | null>(null);
  const [pinValue, setPinValue] = useState("0000");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== ALL && u.role !== roleFilter) return false;
      if (!needle) return true;
      return (
        u.name.toLowerCase().includes(needle) ||
        u.position.toLowerCase().includes(needle) ||
        (u.email?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [users, q, roleFilter]);

  const handleCreate = (data: { name: string; position: string; role: string; email: string; pin: string }) => {
    start(async () => {
      const res = await createUser(data);
      if (res.ok) {
        toast.success(res.message ?? "Үүсгэлээ");
        setCreateOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleUpdate = (id: string, data: { name: string; position: string; role: string; email: string }) => {
    start(async () => {
      const res = await updateUser(id, data);
      if (res.ok) {
        toast.success(res.message ?? "Хадгаллаа");
        setEditing(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleResetPin = () => {
    if (!pinTarget) return;
    start(async () => {
      const res = await resetUserPin(pinTarget.id, pinValue);
      if (res.ok) {
        toast.success(res.message ?? "Шинэчлэгдлээ");
        setPinTarget(null);
        setPinValue("0000");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      const res = await deleteUser(deleteTarget.id);
      if (res.ok) {
        toast.success(res.message ?? "Устгалаа");
        setDeleteTarget(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Нэр, имэйл, албан тушаалаар хайх..."
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Үүрэг" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Бүх үүрэг</SelectItem>
            <SelectItem value="TEACHER">Багш</SelectItem>
            <SelectItem value="APPROVER">Баталгаажуулагч</SelectItem>
            <SelectItem value="ADMIN">Админ</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Нэмэх
        </Button>
      </div>

      <div className="mb-2 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {users.length} хэрэглэгч
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Нэр</th>
              <th className="px-4 py-3 text-left">Үүрэг</th>
              <th className="hidden px-4 py-3 text-left sm:table-cell">Имэйл</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Үсэг</th>
              <th className="w-44 px-4 py-3 text-right">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filtered.map((u) => {
              return (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.position}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        ROLE_BADGE[u.role] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {u.role === "ADMIN" && <ShieldAlert className="h-3 w-3" />}
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {u.email ?? <span className="italic text-muted-foreground/60">—</span>}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums md:table-cell">
                    {u.role === "APPROVER" ? (
                      <span>{u.signedCount} зурсан</span>
                    ) : u.role === "TEACHER" ? (
                      <span>{u.receivedCount} хүлээн авсан</span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setEditing(u)}
                        disabled={pending}
                        title="Засах"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setPinTarget(u);
                          setPinValue("0000");
                        }}
                        disabled={pending}
                        title="PIN сэргээх"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setDeleteTarget(u)}
                        disabled={pending}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        title="Устгах"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Хэрэглэгч олдсонгүй
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        pending={pending}
        onSubmit={handleCreate}
      />

      <UserDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        mode="edit"
        pending={pending}
        initial={editing ?? undefined}
        onSubmit={(data) => editing && handleUpdate(editing.id, data)}
      />

      <Dialog open={!!pinTarget} onOpenChange={(v) => !v && !pending && setPinTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>PIN сэргээх</DialogTitle>
            <DialogDescription>
              {pinTarget?.name}-ийн шинэ PIN-г оруулна уу.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newPin">Шинэ PIN</Label>
            <Input
              id="newPin"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              maxLength={8}
              placeholder="0000"
            />
            <p className="text-xs text-muted-foreground">4-8 тэмдэгт. Анхдагч: 0000.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button onClick={handleResetPin} disabled={pending || pinValue.length < 4}>
              Сэргээх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center">Хэрэглэгч устгах уу?</DialogTitle>
            <DialogDescription className="text-center">
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> устгагдаж,
              түүний бүх гарын үсэг устаж буцаагдашгүй.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Болих
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              Устгах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
