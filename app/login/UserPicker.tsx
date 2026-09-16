"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Search, UserX, ShieldCheck, Briefcase, GraduationCap, Clock, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { loginAs, getStaffRoster, type UserSearchResult } from "./actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, matchesSearch } from "@/lib/utils";

const AVATAR_PALETTE = [
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
];

function avatarColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

const MAX_RESULTS = 8;
const RECENT_KEY = "surguuli:recent-logins";
const RECENT_LIMIT = 3;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = loadRecent().filter((v) => v !== id);
    const next = [id, ...current].slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage might be blocked (private mode) — silently ignore.
  }
}

function BouncingDots() {
  return (
    <span className="ml-1 inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-foreground"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function PinDialog({
  user,
  pin,
  setPin,
  pending,
  onSubmit,
}: {
  user: UserSearchResult | null;
  pin: string;
  setPin: (v: string) => void;
  pending: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pending) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [pending]);

  const accent = user ? avatarColor(user.id) : "bg-muted text-muted-foreground";
  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative flex flex-col items-center px-8 pb-8 pt-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm",
          accent,
        )}
      >
        {initial}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-4 text-center"
      >
        <p className="text-lg font-semibold text-foreground">{user?.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{user?.position}</p>
      </motion.div>

      <div className="mt-7 w-full">
        <AnimatePresence mode="wait" initial={false}>
          {pending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center justify-center gap-3 py-4"
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary/15"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </motion.div>
              </div>
              <p className="text-sm font-medium text-foreground">
                Нэвтэрч байна
                <BouncingDots />
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              onSubmit={onSubmit}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                PIN код
              </p>

              <div className="relative">
                <div className="flex gap-2.5">
                  {[0, 1, 2, 3].map((i) => {
                    const filled = i < pin.length;
                    const active = i === pin.length;
                    return (
                      <motion.div
                        key={i}
                        animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                        transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
                        className={cn(
                          "relative flex h-14 w-12 items-center justify-center rounded-xl border-2 bg-muted/50 transition-all",
                          filled
                            ? "border-primary bg-primary/10"
                            : active
                            ? "border-primary/60 bg-card shadow-sm"
                            : "border-border",
                        )}
                      >
                        <AnimatePresence mode="wait">
                          {filled && (
                            <motion.span
                              key="dot"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 340, damping: 18 }}
                              className="h-3 w-3 rounded-full bg-primary"
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
                <Input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-xl opacity-0"
                  aria-label="PIN код"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                4 оронтой PIN кодоо бичнэ үү
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function UserRow({
  u,
  onSelect,
  onFocusMove,
  active,
}: {
  u: UserSearchResult;
  onSelect: (u: UserSearchResult) => void;
  onFocusMove: (dir: 1 | -1) => void;
  active: boolean;
}) {
  return (
    <motion.button
      key={u.id}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => onSelect(u)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onFocusMove(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          onFocusMove(-1);
        }
      }}
      aria-label={`${u.name} болж нэвтрэх`}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
        active
          ? "border-primary/40 bg-accent"
          : "border-transparent hover:border-border hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold",
          avatarColor(u.id),
        )}
      >
        {u.name[0] ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
        <p className="truncate text-xs text-muted-foreground">{u.position}</p>
      </div>
      {u.role === "APPROVER" ? (
        <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Баталгаажуулагч" />
      ) : (
        <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Багш" />
      )}
    </motion.button>
  );
}

/**
 * Search-driven login. The staff roster is fetched ONCE — lazily on the
 * first focus of the search input — and all subsequent typing filters that
 * cached list on the client. No more per-keystroke round-trips.
 */
export default function UserPicker() {
  const [q, setQ] = useState("");
  const [roster, setRoster] = useState<UserSearchResult[] | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();
  const [activeIdx, setActiveIdx] = useState(0);
  const submittedRef = useRef(false);
  const rosterFetchStartedRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    setRecentIds(loadRecent());
  }, []);

  const fetchRoster = useCallback(() => {
    if (rosterFetchStartedRef.current || roster) return;
    rosterFetchStartedRef.current = true;
    setRosterLoading(true);
    getStaffRoster()
      .then((res) => {
        if (!res.ok) {
          toast.error(res.error);
          rosterFetchStartedRef.current = false;
          return;
        }
        setRoster(res.users);
      })
      .catch(() => {
        rosterFetchStartedRef.current = false;
        toast.error("Сүлжээний алдаа гарлаа.");
      })
      .finally(() => setRosterLoading(false));
  }, [roster]);

  // Filter locally with the shared Cyrillic-aware fuzzy matcher.
  const results = useMemo(() => {
    if (!roster) return [] as UserSearchResult[];
    const needle = q.trim();
    if (!needle) return [];
    return roster
      .filter((u) => matchesSearch(`${u.name} ${u.position}`, needle))
      .slice(0, MAX_RESULTS);
  }, [q, roster]);

  // Recent picks that still exist in the roster — shown when the query is
  // empty so returning users are one tap from signing in.
  const recentUsers = useMemo(() => {
    if (!roster || recentIds.length === 0) return [];
    const byId = new Map(roster.map((u) => [u.id, u]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((u): u is UserSearchResult => !!u);
  }, [roster, recentIds]);

  // Reset keyboard-highlight index whenever the visible list changes.
  useEffect(() => {
    setActiveIdx(0);
  }, [q, roster]);

  const submit = (value: string) => {
    if (!selected || pending) return;
    if (value.length < 4) return;
    submittedRef.current = true;
    start(async () => {
      const fd = new FormData();
      fd.append("userId", selected.id);
      fd.append("pin", value);
      const res = await loginAs(fd);
      submittedRef.current = false;
      if (res?.error) {
        toast.error(res.error);
        setPin("");
      } else {
        saveRecent(selected.id);
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(pin);
  };

  useEffect(() => {
    if (pin.length === 4 && !pending && !submittedRef.current) {
      submit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const closeDialog = (open: boolean) => {
    if (!open && !pending) {
      setSelected(null);
      setPin("");
    }
  };

  // Arrow-key nav across the visible list (either results or recents).
  const visible = q.trim() ? results : recentUsers;
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (visible.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = visible[activeIdx];
      if (pick) setSelected(pick);
    }
  };

  return (
    <>
      <div className="border-b px-5 pb-4 pt-5">
        <p className="mb-3 text-sm font-medium text-foreground">
          Нэрээ хайж олоод, PIN кодоо оруулна уу
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Овог, нэр эсвэл албан тушаалаар хайх..."
            aria-label="Хэрэглэгч хайх"
            autoComplete="off"
            className="pl-9"
            value={q}
            onFocus={fetchRoster}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          {rosterLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div
        ref={rowsRef}
        className="max-h-[45vh] min-h-[180px] overflow-y-auto px-5 py-4"
      >
        {!roster && !rosterLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <Search className="h-6 w-6" />
            <p className="text-sm">Нэрээ бичиж эхэлнэ үү</p>
          </div>
        ) : !roster && rosterLoading ? (
          <RosterSkeleton />
        ) : q.trim().length === 0 ? (
          recentUsers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3 w-3" />
                Сүүлд нэвтэрсэн
              </div>
              <div className="grid grid-cols-1 gap-2">
                {recentUsers.map((u, i) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    active={i === activeIdx}
                    onSelect={setSelected}
                    onFocusMove={(dir) =>
                      setActiveIdx((idx) =>
                        Math.min(
                          recentUsers.length - 1,
                          Math.max(0, idx + dir),
                        ),
                      )
                    }
                  />
                ))}
              </div>
              <p className="mt-3 px-1 text-[11px] text-muted-foreground">
                Эсвэл дээрх хайлтад нэрээ бичнэ үү
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <Search className="h-6 w-6" />
              <p className="text-sm">Нэрээ бичиж эхэлнэ үү</p>
              <p className="text-xs">Нийт {roster?.length ?? 0} хэрэглэгч</p>
            </div>
          )
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <UserX className="h-6 w-6" />
            <p className="text-sm">Хэрэглэгч олдсонгүй</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {results.map((u, i) => (
              <UserRow
                key={u.id}
                u={u}
                active={i === activeIdx}
                onSelect={setSelected}
                onFocusMove={(dir) =>
                  setActiveIdx((idx) =>
                    Math.min(results.length - 1, Math.max(0, idx + dir)),
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={closeDialog}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-sm">
          <PinDialog
            user={selected}
            pin={pin}
            setPin={setPin}
            pending={pending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function RosterSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-transparent p-2.5"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
