"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { AnnouncementBar } from "./AnnouncementBar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Нүүр" },
  { href: "/about", label: "Танилцуулга" },
  { href: "/tour", label: "Виртуал аялал" },
  { href: "/classes", label: "Анги бүлэг" },
  { href: "/quality", label: "Сургалтын чанар" },
  { href: "/protection", label: "Хүүхэд хамгаалал" },
  { href: "/news", label: "Мэдээ" },
  { href: "/contact", label: "Холбоо" },
] as const;

export function SiteHeaderClient({ announcements }: { announcements: string[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  return (
    <>
      <AnnouncementBar items={announcements} />

      <header
        className={cn(
          "sticky top-0 z-30 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/95 shadow-[0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-xl"
            : "border-b border-transparent bg-background/80 backdrop-blur",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center">
            <Logo size={36} priority />
          </Link>

          {/* School name — only on large screens, fixed width */}
          <Link
            href="/"
            className="hidden shrink-0 text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary xl:block"
          >
            Монгол 3-р сургууль
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
                    "relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-x-1 -bottom-[1px] h-0.5 rounded-full bg-primary"
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
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Цэс"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-foreground transition-all duration-200 lg:hidden",
              menuOpen
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-accent",
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[57px] z-50 border-b border-border bg-background/95 shadow-xl backdrop-blur-xl lg:hidden"
            >
              <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
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
                            "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-accent",
                          )}
                        >
                          {link.label}
                          {isActive && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile actions */}
                <div className="mt-4 flex items-center justify-end border-t border-border pt-4">
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
