"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "Бүгд" },
  { value: "password", label: "PIN / password" },
  { value: "auth", label: "Нэвтрэлт" },
  { value: "user", label: "Хэрэглэгч" },
  { value: "signature", label: "Гарын үсэг" },
  { value: "classroom", label: "Анги" },
  { value: "student", label: "Сурагч" },
];

export default function AuditFilter({ current }: { current: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {CATEGORIES.map((c) => {
        const active = current === c.value;
        return (
          <Link
            key={c.value}
            href={c.value === "all" ? "/dashboard/admin/audit" : `/dashboard/admin/audit?category=${c.value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
