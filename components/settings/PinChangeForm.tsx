"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPin } from "@/app/actions/self-pin";

// Actor-agnostic PIN change UI. Backed by app/actions/self-pin.ts which
// routes to the right table based on the current session actor kind.
export function PinChangeForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, start] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    start(async () => {
      const res = await changeMyPin({ currentPin, newPin, confirmPin });
      if (res.ok) {
        toast.success(res.message ?? "Хадгалагдлаа");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else toast.error(res.error);
    });
  };

  const disabled =
    busy || currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4 || newPin !== confirmPin;

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="pin-cur">Одоогийн PIN</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pin-cur"
            type="password"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.slice(0, 8))}
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="4-8 оронтой"
            disabled={busy}
            className="pl-9 tracking-widest"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pin-new">Шинэ PIN</Label>
          <Input
            id="pin-new"
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.slice(0, 8))}
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="4-8 оронтой"
            disabled={busy}
            className="tracking-widest"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pin-new2">PIN давтах</Label>
          <Input
            id="pin-new2"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.slice(0, 8))}
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="Дахин оруулна уу"
            disabled={busy}
            className="tracking-widest"
          />
        </div>
      </div>
      {newPin.length > 0 && confirmPin.length > 0 && newPin !== confirmPin && (
        <p className="text-[11px] text-destructive">Хоёр PIN таарахгүй байна.</p>
      )}
      <Button type="submit" disabled={disabled} className="gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Шинэчлэх
      </Button>
    </form>
  );
}
