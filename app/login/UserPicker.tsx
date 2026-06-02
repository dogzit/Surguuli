"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { Briefcase, GraduationCap, Search, UserX, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { loginAs } from "./actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type User = { id: string; name: string; position: string; role: string };
type Tab = "approver" | "teacher";

function PinDialog({
  user,
  pin,
  setPin,
  pending,
  onSubmit,
}: {
  user: User | null;
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

              <div
                onClick={() => inputRef.current?.focus()}
                className="flex gap-2.5"
              >
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
                className="sr-only"
                aria-label="PIN код"
              />

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
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function UserPicker({ teachers, approvers }: { teachers: User[]; approvers: User[] }) {
  const [tab, setTab] = useState<Tab>("approver");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();
  const submittedRef = useRef(false);

  const filtered = useMemo(() => {
    const users = tab === "teacher" ? teachers : approvers;
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => u.name.toLowerCase().includes(needle));
  }, [tab, q, teachers, approvers]);

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

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
        <div className="border-b px-6 pt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approver"><Briefcase className="mr-2 h-4 w-4" />Баталгаажуулагч</TabsTrigger>
            <TabsTrigger value="teacher"><GraduationCap className="mr-2 h-4 w-4" />Багш</TabsTrigger>
          </TabsList>
          <div className="relative mt-4 mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Хайх..."
              aria-label="Хэрэглэгч хайх"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={tab} className="max-h-[400px] overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground"
              >
                <UserX className="h-6 w-6" />
                <p className="text-sm">Хэрэглэгч олдсонгүй</p>
              </motion.div>
            ) : (
              <motion.div
                key={`${tab}-${q}`}
                variants={listVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-2"
              >
                {filtered.map((u) => (
                  <motion.button
                    key={u.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setSelected(u)}
                    aria-label={`${u.name} болж нэвтрэх`}
                    className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-accent border border-transparent hover:border-border"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                        avatarColor(u.id),
                      )}
                    >
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.position}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

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
