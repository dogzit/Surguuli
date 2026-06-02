"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { updateEmail } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  currentEmail: string | null;
}

export default function EmailForm({ currentEmail }: Props) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [pending, start] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.append("email", email);
      const result = await updateEmail(fd);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Имэйл хаяг</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">
          Хоосон үлдээх бол идэвхгүй болгоно.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Хадгалж байна..." : "Хадгалах"}
      </Button>
    </form>
  );
}
