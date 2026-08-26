"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, User, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { AnnouncementBar } from "./AnnouncementBar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Нүүр" },
  { href: "/tour", label: "Виртуал аялал" },
  { href: "/classes", label: "Анги бүлэг" },
  { href: "/schedule", label: "Хичээлийн хуваарь" },
  { href: "/time-calc", label: "Цагийн тооцоо" },
  { href: "/teacher-eval", label: "Багшийн үнэлгээ" },
  { href: "/budget", label: "Төсөв" },
  { href: "/quality", label: "Сургалтын чанар" },
  { href: "/protection", label: "Хүүхэд хамгаалал" },
  { href: "/news", label: "Мэдээ" },
  { href: "/contact", label: "Холбоо" },
] as const;

export function SiteHeaderClient({ announcements }: { announcements: string[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authState, setAuthState] = useState<{ loggedIn: boolean; role?: string; name?: string }>({ loggedIn: false });
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Fetch auth status
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setAuthState)
      .catch(() => setAuthState({ loggedIn: false }));
  }, []);

  // Escape closes menu + body scroll lock while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      <AnnouncementBar items={announcements} />

      <header
        className={cn(
          "sticky top-0 z-30 transition-all duration-300",
          scrolled
            ? "border-b border-border/50 bg-background/80 shadow-[0_4px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
            : "border-b border-border/30 bg-background/60 backdrop-blur-xl",
        )}
      >
        {/* Subtle gradient line at the very top */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 opacity-60" />

        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center">
            <Logo size={38} priority />
          </Link>

          {/* School name — only on large screens, fixed width */}
          <Link
            href="/"
            className="hidden shrink-0 text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary xl:block"
          >
            Нийслэлийн ерөнхий боловсролын 3-р сургууль
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden shrink-0 items-center gap-0.5 xl:flex">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-x-1 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <ThemeToggle />
            {authState.loggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href={authState.role === "ADMIN" || authState.role === "APPROVER" ? "/dashboard/admin" : "/dashboard/teacher"}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-primary/30"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{authState.name || "Хэрэглэгч"}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <LogIn className="h-4 w-4" />
                Нэвтрэх
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Цэс"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-foreground transition-all duration-200 xl:hidden",
              menuOpen
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/60 bg-background/50 hover:bg-accent backdrop-blur",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[57px] z-50 border-b border-border/50 bg-background/95 shadow-2xl backdrop-blur-2xl xl:hidden"
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                {/* Mobile nav links */}
                <nav className="space-y-1">
                  {NAV_LINKS.map((link, idx) => {
                    const isActive =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: idx * 0.03,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={link.href}
                          className={cn(
                            "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
                          )}
                        >
                          {link.label}
                          {isActive && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.4)]" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile auth */}
                <div className="mt-4 border-t border-border/50 pt-4">
                  {authState.loggedIn ? (
                    <div className="space-y-2">
                      <Link
                        href={authState.role === "ADMIN" || authState.role === "APPROVER" ? "/dashboard/admin" : "/dashboard/teacher"}
                        className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
                      >
                        <User className="h-4 w-4" />
                        {authState.name || "Хэрэглэгч"}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Гарах
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-sm font-medium text-white shadow-lg"
                    >
                      <LogIn className="h-4 w-4" />
                      Нэвтрэх
                    </Link>
                  )}
                </div>

                {/* Mobile actions */}
                <div className="mt-4 flex items-center justify-end border-t border-border/50 pt-4">
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
