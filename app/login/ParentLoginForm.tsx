"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, LogIn, Mail, Sparkles, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loginAsParent, redeemParentInvite } from "@/app/actions/auth-parent";

type Mode = "login" | "register";

export default function ParentLoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  return (
    <div className="p-6">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        <TabButton active={mode === "login"} onClick={() => setMode("login")}>
          <LogIn className="mr-1.5 h-3.5 w-3.5" />
          Нэвтрэх
        </TabButton>
        <TabButton active={mode === "register"} onClick={() => setMode("register")}>
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Бүртгүүлэх
        </TabButton>
      </div>

      {mode === "login" ? <LoginPanel /> : <RegisterPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md py-1.5 text-xs font-medium transition",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function LoginPanel() {
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending || !email.trim() || pin.length < 4) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("email", email.trim());
      fd.append("pin", pin);
      const res = await loginAsParent(fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setPin("");
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="parent-email">И-мэйл хаяг</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="parent-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="name@example.com"
            disabled={pending}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="parent-pin">PIN</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="parent-pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 8))}
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="4-8 оронтой"
            disabled={pending}
            className="pl-9 tracking-widest"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">PIN мартвал:</span>{" "}
        сургуулийн захиргаа руу утсаар хандан шинэ PIN хүсэх боломжтой. Онлайн сэргээх боломж
        удахгүй нэмэгдэнэ.
      </p>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !email.trim() || pin.length < 4}
      >
        {pending ? "Нэвтрэж байна…" : "Нэвтрэх"}
      </Button>
    </form>
  );
}

function RegisterPanel() {
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    pin: "",
    pinConfirm: "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await redeemParentInvite(fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  const disabled =
    pending ||
    form.code.trim().length < 6 ||
    !form.name.trim() ||
    !form.email.trim() ||
    form.pin.length < 4 ||
    form.pin !== form.pinConfirm;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ангийн багшаас авсан <span className="font-semibold text-foreground">урилгын код</span> ашиглан
          бүртгүүлнэ. Нэг код нэг хүүхэдтэй холбоно.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-code">Урилгын код</Label>
        <Input
          id="invite-code"
          value={form.code}
          onChange={(e) => set("code", e.target.value.toUpperCase())}
          placeholder="ABC12345"
          maxLength={12}
          disabled={pending}
          className="font-mono uppercase tracking-widest"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Овог, нэр</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Б. Дорж"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-phone">Утас (заавал биш)</Label>
          <Input
            id="p-phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/[^0-9+ ]/g, "").slice(0, 20))}
            placeholder="99112233"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="p-email">И-мэйл</Label>
        <Input
          id="p-email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="name@example.com"
          disabled={pending}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-pin">Шинэ PIN</Label>
          <Input
            id="p-pin"
            type="password"
            value={form.pin}
            onChange={(e) => set("pin", e.target.value.slice(0, 8))}
            inputMode="numeric"
            placeholder="4-8 оронтой"
            disabled={pending}
            className="tracking-widest"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-pin2">PIN давтах</Label>
          <Input
            id="p-pin2"
            type="password"
            value={form.pinConfirm}
            onChange={(e) => set("pinConfirm", e.target.value.slice(0, 8))}
            inputMode="numeric"
            placeholder="Дахин оруулна уу"
            disabled={pending}
            className="tracking-widest"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={disabled}>
        {pending ? "Бүртгэж байна…" : "Бүртгүүлэх"}
      </Button>
    </form>
  );
}
