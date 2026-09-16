"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAsAdmin } from "@/app/actions/admin-login";

// .env-д ямар ч төрлийн passcode тавьсан ч 64 тэмдэгт хүрэлцэнэ.
const PIN_MAX = 64;
const PIN_MIN = 4;

interface AdminGateProps {
  // Server-с ирэх role — null = session байхгүй, "APPROVER" = session
  // байгаа боловч admin PIN дутуу.
  role?: "ADMIN" | "APPROVER" | "TEACHER" | null;
}

export default function AdminGate({ role = null }: AdminGateProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const submit = () => {
    if (pending) return;
    const trimmed = pin.trim();
    if (trimmed.length < PIN_MIN) return;
    start(async () => {
      const res = await loginAsAdmin(trimmed);
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.message ?? "Буруу PIN");
        setPin("");
        inputRef.current?.focus();
      }
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const heading =
    role === "APPROVER"
      ? "Админ хэсэг · Нэмэлт PIN"
      : "Super Admin Passcode";
  const sub =
    role === "APPROVER"
      ? "Энэ хуудсанд орохын тулд админы passcode шаардлагатай."
      : ".env файлын ADMIN_PIN утгыг оруулна уу";

  return (
    <main className="flex items-center justify-center px-4 pb-6 pt-10 sm:pt-14">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {role === "APPROVER" ? (
              <ShieldAlert className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {heading}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <Input
              ref={inputRef}
              type={showPin ? "text" : "password"}
              autoComplete="one-time-code"
              maxLength={PIN_MAX}
              value={pin}
              disabled={pending}
              onChange={(e) => setPin(e.target.value.slice(0, PIN_MAX))}
              placeholder="passcode..."
              className="pr-10 tracking-widest"
              aria-label="Admin passcode"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:text-foreground"
              tabIndex={-1}
              aria-label={showPin ? "PIN нуух" : "PIN харах"}
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={pending || pin.trim().length < PIN_MIN}
        >
          {pending ? (
            <>
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Шалгаж байна...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Нэвтрэх
            </>
          )}
        </Button>
      </form>
    </main>
  );
}
