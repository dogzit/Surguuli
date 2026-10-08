"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Home, Plane, Users, Calendar, Clock, Star, Wallet,
  BookOpen, Shield, Newspaper, Phone, ChevronRight,
  PanelLeftClose, PanelLeftOpen,
  Search, MessageSquareHeart,
} from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

// Nav is intentionally trimmed to pages that have real content today.
// /schedule, /time-calc, /teacher-eval, /budget still exist as routes
// (in case anyone has an old bookmark) but they render a branded
// coming-soon state instead of being surfaced in the primary nav.
const NAV_LINKS = [
  { href: "/", label: "Нүүр", icon: Home },
  { href: "/tour", label: "Виртуал аялал", icon: Plane },
  { href: "/classes", label: "Анги бүлэг", icon: Users },
  { href: "/quality", label: "Сургалтын чанар", icon: BookOpen },
  { href: "/protection", label: "Хүүхэд хамгаалал", icon: Shield },
  { href: "/news", label: "Мэдээ", icon: Newspaper },
  { href: "/search", label: "Хайлт", icon: Search },
  { href: "/contact", label: "Холбоо", icon: Phone },
] as const;

export default function PublicSidebar({ schoolName }: { schoolName: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="border-b border-border/50 px-4 py-5">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <Logo size={32} />
          <div className="min-w-0">
            {schoolName && (
              <div className="text-xs font-bold tracking-tight text-foreground line-clamp-2">
                {schoolName}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="flex-1">{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary),0.4)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Feedback call-to-action — the page people reach from the QR posters. */}
      <Link
        href="/feedback"
        onClick={onNavigate}
        className="group relative mx-3 mb-3 block overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0d4ea6,#0a2f6b)] p-3.5 text-white shadow-lg shadow-[#0a2f6b]/20 transition hover:-translate-y-0.5"
      >
        <span aria-hidden className="absolute -right-5 -top-5 h-14 w-14 rounded-full border-4 border-[#ffc928]/60" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <MessageSquareHeart className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Санал хүсэлт</span>
            <span className="block text-[11px] text-white/75">Санал, гомдол, талархал</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-70 transition group-hover:translate-x-0.5" />
        </div>
      </Link>

    </>
  );

  return (
    <>
      {/* Mobile hamburger button - higher z-index, positioned above signature widget */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-[80] flex h-full w-72 flex-col border-r border-border bg-background lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - FIXED position */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/50 bg-card/50 lg:flex transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle button */}
        <button
          type="button"
          onClick={toggle}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border/50 bg-background shadow-md hover:bg-accent transition-all"
          title={collapsed ? "Sidebar нээх" : "Sidebar нуух"}
        >
          {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {collapsed ? (
          <div className="flex flex-col items-center py-5">
            <Link href="/" className="mb-4">
              <Logo size={28} />
            </Link>
            <nav className="space-y-2">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                    title={link.label}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
              <Link
                href="/feedback"
                title="Санал хүсэлт"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d4ea6] text-white shadow-md shadow-[#0a2f6b]/30 transition hover:bg-[#0a2f6b]"
              >
                <MessageSquareHeart className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        ) : (
          <NavContent />
        )}
      </aside>

      {/* Fixed theme toggle - top right */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
    </>
  );
}
