"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginAsAdmin } from "@/app/actions/admin-login";

export default function AdminGate() {
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const submittedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const submit = (value: string) => {
    if (pending) return;
    submittedRef.current = true;
    start(async () => {
      const res = await loginAsAdmin(value);
      submittedRef.current = false;
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
    if (pin.length >= 4) submit(pin);
  };

  useEffect(() => {
    if (pin.length >= 4 && !pending && !submittedRef.current) {
      submit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        onClick={() => inputRef.current?.focus()}
        className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Админ PIN
        </p>

        <div className="mt-4 flex justify-center gap-2.5">
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            const active = i === pin.length && !pending;
            return (
              <div
                key={i}
                className={cn(
                  "flex h-14 w-12 items-center justify-center rounded-xl border-2 bg-muted/50 transition-all",
                  filled
                    ? "border-primary bg-primary/10"
                    : active
                    ? "border-primary/60 bg-card shadow-sm"
                    : "border-border",
                )}
              >
                {filled && <span className="h-3 w-3 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>

        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={8}
          value={pin}
          disabled={pending}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="sr-only"
          aria-label="Админ PIN"
        />

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {pending ? "Шалгаж байна..." : "PIN кодоо оруулна уу"}
        </p>
      </form>
    </main>
  );
}
