"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileSignature,
  Home,
  Loader2,
  LogOut,
  Briefcase,
} from "lucide-react";
import Logo from "@/components/Logo";
import { logout } from "@/app/login/actions";

interface UserInfo {
  name: string;
  position: string;
}

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ApproverLanding() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              className="h-16 w-16 rounded-2xl bg-primary/10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
          <Logo size={56} priority />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {user?.name || "Баталгаажуулагч"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.position || "Албан тушаал"}
        </p>
      </motion.div>

      {/* Choice cards */}
      <div className="grid w-full max-w-md gap-4">
        <motion.div custom={0} variants={fade} initial="hidden" animate="visible">
          <Link
            href="/dashboard/admin"
            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 text-red-500 shadow-sm transition-transform group-hover:scale-105">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-foreground">
                Админ хяналт
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Системийн удирдлага, тоо баримт
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div custom={1} variants={fade} initial="hidden" animate="visible">
          <Link
            href="/dashboard/approver/signatures"
            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-500 shadow-sm transition-transform group-hover:scale-105">
              <FileSignature className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-foreground">
                Гарын үсэг
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Багш нарын гарын үсэг зурах
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div custom={2} variants={fade} initial="hidden" animate="visible">
          <Link
            href="/"
            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 shadow-sm transition-transform group-hover:scale-105">
              <Home className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-foreground">
                Сургуулийн хуудас
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Нүүр хуудас руу очих
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Logout */}
      <motion.div
        custom={3}
        variants={fade}
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Гарах
          </button>
        </form>
      </motion.div>
    </div>
  );
}
