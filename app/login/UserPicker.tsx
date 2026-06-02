"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Briefcase, GraduationCap, KeyRound, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginAs } from "./actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type User = { id: string; name: string; position: string; role: string };

export default function UserPicker({ teachers, approvers }: { teachers: User[]; approvers: User[] }) {
  const [tab, setTab] = useState<"approver" | "teacher">("approver");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const users = tab === "teacher" ? teachers : approvers;
    return users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
  }, [tab, q, teachers, approvers]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    start(async () => {
      const fd = new FormData();
      fd.append("userId", selected.id);
      fd.append("pin", pin);
      const res = await loginAs(fd);
      if (res?.error) toast.error(res.error);
    });
  };

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <div className="border-b px-6 pt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approver"><Briefcase className="mr-2 h-4 w-4" />Баталгаажуулагч</TabsTrigger>
            <TabsTrigger value="teacher"><GraduationCap className="mr-2 h-4 w-4" />Багш</TabsTrigger>
          </TabsList>
          <div className="relative mt-4 mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Хайх..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <TabsContent value={tab} className="max-h-[400px] overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((u) => (
              <button key={u.id} onClick={() => setSelected(u)} className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-slate-50 border border-transparent hover:border-slate-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{u.name[0]}</div>
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.position}</p>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Нэвтрэх: {selected?.name}</DialogTitle>
            <DialogDescription>PIN кодоо оруулна уу</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Input
              type="password" autoFocus maxLength={4} className="h-12 text-center text-xl tracking-[0.5em]"
              value={pin} onChange={(e) => setPin(e.target.value)} placeholder="0000"
            />
            <Button className="w-full" disabled={pending || pin.length < 4}>
              {pending ? <Loader2 className="animate-spin" /> : "Нэвтрэх"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}