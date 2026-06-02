"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormState {
  name: string;
  position: string;
  role: string;
  email: string;
  pin: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  pending: boolean;
  initial?: { name: string; position: string; role: string; email: string | null };
  onSubmit: (data: FormState) => void;
}

const EMPTY: FormState = {
  name: "",
  position: "",
  role: "TEACHER",
  email: "",
  pin: "0000",
};

export default function UserDialog({ open, onClose, mode, pending, initial, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        position: initial.position,
        role: initial.role,
        email: initial.email ?? "",
        pin: "0000",
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, initial]);

  const update = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Шинэ хэрэглэгч" : "Хэрэглэгч засах"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Шинэ хэрэглэгч нэмж бүртгэнэ үү."
              : "Мэдээллийг шинэчилнэ үү."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Нэр</Label>
            <Input
              id="u-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Үүрэг</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger id="u-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Багш</SelectItem>
                  <SelectItem value="APPROVER">Баталгаажуулагч</SelectItem>
                  <SelectItem value="ADMIN">Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-position">Албан тушаал</Label>
              <Input
                id="u-position"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-email">Имэйл (заавал биш)</Label>
            <Input
              id="u-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          {mode === "create" && (
            <div className="space-y-1.5">
              <Label htmlFor="u-pin">Анхны PIN</Label>
              <Input
                id="u-pin"
                value={form.pin}
                onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                maxLength={8}
                placeholder="0000"
              />
              <p className="text-xs text-muted-foreground">4-8 тэмдэгт. Анхдагч: 0000.</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Болих
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Хадгалж байна..." : mode === "create" ? "Үүсгэх" : "Хадгалах"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
