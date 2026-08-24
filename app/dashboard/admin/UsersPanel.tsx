"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  Search,
  Pencil,
  KeyRound,
  Trash2,
  ShieldAlert,
  Users,
  UserCheck,
  Shield,
  Crown,
} from "lucide-react";
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
import { cn, matchesSearch } from "@/lib/utils";
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

const ROLE_ICON: Record<string, typeof Users> = {
  TEACHER: Users,
  APPROVER: Shield,
  ADMIN: Crown,
};

const ALL = "__all__";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500",
  "bg-pink-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function UsersPanel({ users }: { users: AdminUser[] }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [pending, start] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [pinTarget, setPinTarget] = useState<AdminUser | null>(null);
  const [pinValue, setPinValue] = useState("0000");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const stats = useMemo(() => ({
    total: users.length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    approvers: users.filter((u) => u.role === "APPROVER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  }), [users]);

  const filtered = useMemo(() => {
    const needle = q.trim();
    return users.filter((u) => {
      if (roleFilter !== ALL && u.role !== roleFilter) return false;
      if (!needle) return true;
      const hay = `${u.name} ${u.position} ${u.email ?? ""}`;
      return matchesSearch(hay, needle);
    });
  }, [users, q, roleFilter]);

  const handleCreate = (data: { name: string; position: string; role: string; email: string; pin: string }) => {
    start(async () => {
      const res = await createUser(data);
      if (res.ok) { toast.success(res.message ?? "Үүсгэлээ"); setCreateOpen(false); }
      else toast.error(res.error);
    });
  };

  const handleUpdate = (id: string, data: { name: string; position: string; role: string; email: string }) => {
    start(async () => {
      const res = await updateUser(id, data);
      if (res.ok) { toast.success(res.message ?? "Хадгаллаа"); setEditing(null); }
      else toast.error(res.error);
    });
  };

  const handleResetPin = () => {
    if (!pinTarget) return;
    start(async () => {
      const res = await resetUserPin(pinTarget.id, pinValue);
      if (res.ok) { toast.success(res.message ?? "Шинэчлэгдлээ"); setPinTarget(null); setPinValue("0000"); }
      else toast.error(res.error);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      const res = await deleteUser(deleteTarget.id);
      if (res.ok) { toast.success(res.message ?? "Устгалаа"); setDeleteTarget(null); }
      else toast.error(res.error);
    });
  };

  return (
    <div>
      {/* Stats Overview */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Нийт" value={stats.total} color="bg-primary/10 text-primary" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Багш" value={stats.teachers} color="bg-sky-500/10 text-sky-500" />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Баталгаажуулагч" value={stats.approvers} color="bg-indigo-500/10 text-indigo-500" />
        <StatCard icon={<Crown className="h-5 w-5" />} label="Админ" value={stats.admins} color="bg-rose-500/10 text-rose-500" />
      </div>

      {/* Search + Filter + Actions */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
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

      <div className="mb-3 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {users.length} хэрэглэгч
      </div>

      {/* User Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((u) => {
          const RoleIcon = ROLE_ICON[u.role] ?? Users;
          return (
            <div
              key={u.id}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
                  getAvatarColor(u.name),
                )}>
                  {getInitials(u.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.position}</div>
                  {u.email && (
                    <div className="mt-0.5 truncate text-xs text-muted-foreground/70">{u.email}</div>
                  )}
                </div>
              </div>

              {/* Role badge + stats */}
              <div className="mt-3 flex items-center justify-between">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  ROLE_BADGE[u.role] ?? "bg-muted text-muted-foreground",
                )}>
                  <RoleIcon className="h-3 w-3" />
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {u.role === "APPROVER"
                    ? `${u.signedCount} зурсан`
                    : u.role === "TEACHER"
                    ? `${u.receivedCount} хүлээн авсан`
                    : ""}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-1 border-t border-border/50 pt-3 opacity-60 transition-opacity group-hover:opacity-100">
                <Button size="xs" variant="outline" onClick={() => setEditing(u)} disabled={pending} className="flex-1">
                  <Pencil className="mr-1 h-3 w-3" /> Засах
                </Button>
                <Button size="xs" variant="outline" onClick={() => { setPinTarget(u); setPinValue("0000"); }} disabled={pending} className="flex-1">
                  <KeyRound className="mr-1 h-3 w-3" /> PIN
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setDeleteTarget(u)}
                  disabled={pending}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Хэрэглэгч олдсонгүй
          </div>
        )}
      </div>

      {/* Dialogs */}
      <UserDialog open={createOpen} onClose={() => setCreateOpen(false)} mode="create" pending={pending} onSubmit={handleCreate} />
      <UserDialog open={!!editing} onClose={() => setEditing(null)} mode="edit" pending={pending} initial={editing ?? undefined} onSubmit={(data) => editing && handleUpdate(editing.id, data)} />

      <Dialog open={!!pinTarget} onOpenChange={(v) => !v && !pending && setPinTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>PIN сэргээх</DialogTitle>
            <DialogDescription>{pinTarget?.name}-ийн шинэ PIN-г оруулна уу.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newPin">Шинэ PIN</Label>
            <Input id="newPin" value={pinValue} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" maxLength={8} placeholder="0000" />
            <p className="text-xs text-muted-foreground">4-8 тэмдэгт. Анхдагч: 0000.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinTarget(null)} disabled={pending}>Болих</Button>
            <Button onClick={handleResetPin} disabled={pending || pinValue.length < 4}>Сэргээх</Button>
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
