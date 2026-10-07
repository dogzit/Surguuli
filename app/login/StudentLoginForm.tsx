"use client";

import { useTransition, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { GraduationCap, KeyRound, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAsStudent } from "@/app/actions/auth-student";

export default function StudentLoginForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pending || !code.trim() || pin.length < 4) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("code", code.trim());
      fd.append("pin", pin);
      // Server action either redirects (success) or returns { error }.
      // In the redirect case this function throws so nothing after runs.
      const res = await loginAsStudent(fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        setPin("");
        toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 p-6">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ангийн багшаас өгсөн <span className="font-semibold text-foreground">сурагчийн код</span> болон
          <span className="font-semibold text-foreground"> PIN</span>-ээ оруулна уу. Кодоо мартсан бол багштайгаа холбогдоно уу.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="student-code">Сурагчийн код</Label>
        <Input
          id="student-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="2А-001"
          autoComplete="username"
          disabled={pending}
          maxLength={20}
          className="font-mono uppercase tracking-widest"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="student-pin">PIN</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-pin"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
            type="password"
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
        ангийн багштайгаа холбогдоно уу. Багш нэг товшилтоор шинэ PIN гаргаж өгөх боломжтой.
      </p>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !code.trim() || pin.length < 4}
      >
        {pending ? (
          <>
            <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Нэвтрэж байна…
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Нэвтрэх
          </>
        )}
      </Button>
    </form>
  );
}
