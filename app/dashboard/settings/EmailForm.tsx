"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import {
  cancelPendingEmailChange,
  requestEmailChange,
  verifyEmailChange,
} from "@/app/actions/email-verify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  currentEmail: string | null;
  // Non-null when the server found a live pending code — puts the
  // form straight into step 2 without re-issuing.
  pending: {
    email: string;
    expiresAt: string;
    attemptsLeft: number;
  } | null;
}

type Step = "enter" | "verify" | "done";

export default function EmailForm({ currentEmail, pending }: Props) {
  const [step, setStep] = useState<Step>(pending ? "verify" : "enter");
  const [email, setEmail] = useState(pending?.email ?? currentEmail ?? "");
  const [pendingEmail, setPendingEmail] = useState<string | null>(pending?.email ?? null);
  const [code, setCode] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(pending?.attemptsLeft ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(pending?.expiresAt ?? null);
  const [busy, start] = useTransition();

  // Live countdown to expiry so the user knows how urgent the code is.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (step !== "verify" || !expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step, expiresAt]);

  const secondsLeft = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
    : 0;
  const codeExpired = step === "verify" && !!expiresAt && secondsLeft === 0;

  const submitRequest = (e: FormEvent) => {
    e.preventDefault();
    if (busy || !email.trim()) return;
    start(async () => {
      const res = await requestEmailChange(email);
      if (res.ok) {
        setPendingEmail(email.trim().toLowerCase());
        setExpiresAt(res.data?.expiresAt ?? null);
        setAttemptsLeft(5);
        setCode("");
        setStep("verify");
        toast.success(res.message ?? "Код илгээгдлээ");
      } else {
        toast.error(res.error);
      }
    });
  };

  const submitVerify = (e: FormEvent) => {
    e.preventDefault();
    if (busy || code.length !== 6) return;
    start(async () => {
      const res = await verifyEmailChange(code);
      if (res.ok) {
        toast.success(res.message ?? "Баталгаажлаа");
        setStep("done");
      } else {
        toast.error(res.error);
        const m = res.error.match(/(\d+)\s+оролдлого/);
        if (m) setAttemptsLeft(Number(m[1]));
      }
    });
  };

  const backToEnter = () => {
    if (busy) return;
    start(async () => {
      await cancelPendingEmailChange();
      setStep("enter");
      setCode("");
      setPendingEmail(null);
      setExpiresAt(null);
      setAttemptsLeft(null);
    });
  };

  // ── Render ───────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <div className="text-sm font-semibold text-foreground">
              И-мэйл шинэчлэгдлээ
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Одоо {pendingEmail} хаяг таны данстай холбогдсон.
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep("enter");
            setEmail(pendingEmail ?? "");
            setPendingEmail(null);
          }}
        >
          Дахин өөрчлөх
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual stepper */}
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <StepPill active={step === "enter"} done={step !== "enter"} icon={<Mail className="h-3 w-3" />}>
          Имэйл оруулах
        </StepPill>
        <span className="h-px flex-1 bg-border" />
        <StepPill active={step === "verify"} done={false} icon={<KeyRound className="h-3 w-3" />}>
          Код баталгаажуулах
        </StepPill>
      </div>

      {step === "enter" && (
        <form onSubmit={submitRequest} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Шинэ имэйл хаяг</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={busy}
            />
            <p className="text-[11px] text-muted-foreground">
              {currentEmail
                ? `Одоогийн: ${currentEmail}`
                : "Одоогоор имэйл тохируулаагүй байна."}
            </p>
          </div>
          <Button
            type="submit"
            disabled={busy || !email.trim() || email.trim().toLowerCase() === currentEmail?.toLowerCase()}
            className="gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Код авах
          </Button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={submitVerify} className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Код илгээгдлээ
            </div>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{pendingEmail}</span>{" "}
              хаяг руу 6 оронтой код илгээв. Хугацаа:{" "}
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  codeExpired ? "text-destructive" : "text-foreground",
                )}
              >
                {formatCountdown(secondsLeft)}
              </span>
              {typeof attemptsLeft === "number" && !codeExpired && (
                <> · {attemptsLeft} оролдлого үлдсэн</>
              )}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verify-code">6 оронтой код</Label>
            <Input
              id="verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              disabled={busy || codeExpired}
              className="text-center text-2xl tracking-[0.6em] font-mono"
              maxLength={6}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={busy || code.length !== 6 || codeExpired}
              className="gap-2"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Баталгаажуулах
            </Button>
            <Button type="button" variant="outline" onClick={backToEnter} disabled={busy}>
              Буцах
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function StepPill({
  active,
  done,
  icon,
  children,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : done
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-border/60 text-muted-foreground",
      )}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : icon}
      {children}
    </span>
  );
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0:00 · хугацаа дууссан";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
