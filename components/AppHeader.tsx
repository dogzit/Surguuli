"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import HeaderActions from "./HeaderActions";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/dashboard/admin");

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
        >
          <Logo size={36} priority />
          {isAdmin && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500">
              ADMIN
            </span>
          )}
          <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline sm:text-base">
            Монгол 3-р сургууль
          </span>
        </Link>
        <div className="shrink-0">
          <HeaderActions />
        </div>
      </div>
    </div>
  );
}
