"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Newspaper, Trophy, UserPlus, Calendar, Info, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/actions/notifications";

interface NotificationRow {
  id: string;
  category: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const CATEGORY_ICON: Record<string, typeof Bell> = {
  news: Newspaper,
  portfolio: Trophy,
  invite: UserPlus,
  event: Calendar,
  feedback: MessageSquareHeart,
  system: Info,
};

const CATEGORY_TONE: Record<string, string> = {
  news: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  portfolio: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  invite: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  event: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  feedback: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  system: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

// Poll every 60s. Cheap query and the bell isn't real-time critical.
const POLL_MS = 60_000;

export function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const json = await res.json();
      setLoggedIn(!!json.loggedIn);
      setItems(json.items ?? []);
      setUnread(json.unread ?? 0);
    } catch {
      // Silent — the bell isn't worth surfacing errors for.
    }
  };

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleItemClick = (item: NotificationRow) => {
    if (item.readAt) return;
    // Fire-and-forget so the click-through isn't blocked.
    start(async () => {
      await markNotificationRead(item.id);
      // Optimistic update — no re-fetch needed.
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    });
  };

  const handleMarkAll = () => {
    if (unread === 0 || pending) return;
    start(async () => {
      const res = await markAllNotificationsRead();
      if (res.ok) {
        setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
        setUnread(0);
        toast.success(`${res.data?.count ?? 0} мэдэгдэл уншсан`);
      } else {
        toast.error(res.error);
      }
    });
  };

  // Hide the bell entirely for anonymous visitors — reduces clutter
  // on the public site.
  if (loggedIn === false) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground",
          open && "border-primary/40 bg-primary/5 text-primary",
        )}
        aria-label="Мэдэгдэл"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Мэдэгдэл</div>
                {unread > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    {unread} шинэ
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={pending || unread === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              >
                <CheckCheck className="h-3 w-3" />
                Бүгдийг уншсан
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Одоогоор мэдэгдэл алга.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {items.map((n) => {
                    const Icon = CATEGORY_ICON[n.category] ?? Info;
                    const tone = CATEGORY_TONE[n.category] ?? CATEGORY_TONE.system!;
                    const inner = (
                      <div
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors",
                          n.readAt ? "opacity-70" : "bg-primary/[0.02]",
                          n.href && "hover:bg-accent/40",
                        )}
                      >
                        <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-xs font-semibold text-foreground line-clamp-2">
                              {n.title}
                            </p>
                            {!n.readAt && (
                              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] tabular-nums text-muted-foreground/60">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id} onClick={() => handleItemClick(n)}>
                        {n.href ? (
                          <Link href={n.href} className="block" onClick={() => setOpen(false)}>
                            {inner}
                          </Link>
                        ) : (
                          <div>{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Яг одоо";
  if (min < 60) return `${min} мин өмнө`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} цаг өмнө`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d} өдөр өмнө`;
  return new Date(iso).toLocaleDateString("mn-MN");
}
