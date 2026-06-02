"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { updatePin } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PinForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.append("current", current);
      fd.append("next", next);
      fd.append("confirm", confirm);
      const result = await updatePin(fd);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current">Одоогийн PIN</Label>
        <Input
          id="current"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="••••"
          maxLength={8}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next">Шинэ PIN</Label>
        <Input
          id="next"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="••••"
          minLength={4}
          maxLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">4-8 тэмдэгт.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Шинэ PIN-г давтан оруулах</Label>
        <Input
          id="confirm"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••"
          maxLength={8}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={pending || !current || !next || !confirm}
      >
        {pending ? "Шинэчилж байна..." : "PIN солих"}
      </Button>
    </form>
  );
}
