"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Home, Plane, Users, Calendar, Clock, Star, Wallet,
  BookOpen, Shield, Newspaper, Phone, LogIn, LogOut, User, ChevronRight,
  PanelLeftClose, PanelLeftOpen, AlertTriangle,
} from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Нүүр", icon: Home },
  { href: "/tour", label: "Виртуал аялал", icon: Plane },
  { href: "/classes", label: "Анги бүлэг", icon: Users },
  { href: "/schedule", label: "Хичээлийн хуваарь", icon: Calendar },
  { href: "/time-calc", label: "Цагийн тооцоо", icon: Clock },
  { href: "/teacher-eval", label: "Багшийн үнэлгээ", icon: Star },
  { href: "/budget", label: "Төсөв", icon: Wallet },
  { href: "/quality", label: "Сургалтын чанар", icon: BookOpen },
  { href: "/protection", label: "Хүүхэд хамгаалал", icon: Shield },
  { href: "/news", label: "Мэдээ", icon: Newspaper },
  { href: "/contact", label: "Холбоо", icon: Phone },
] as const;

export default function PublicSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState<{ loggedIn: boolean; role?: string; name?: string }>({ loggedIn: false });
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then(setAuthState)
      .catch(() => setAuthState({ loggedIn: false }));
  }, []);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
      setLogoutModal(false);
    }
  };

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="border-b border-border/50 px-4 py-5">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <Logo size={32} />
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-tight text-foreground line-clamp-2">
              Нийслэлийн ерөнхий боловсролын 3-р сургууль
            </div>
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

      {/* Bottom section - pinned to bottom */}
      <div className="mt-auto border-t border-border/50">
        {/* Auth */}
        <div className="px-3 py-4">
          {authState.loggedIn ? (
            <div className="space-y-2">
              <Link
                href={
                  authState.role === "ADMIN" || authState.role === "APPROVER"
                    ? "/dashboard/admin"
                    : "/dashboard/teacher"
                }
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/15"
              >
                <User className="h-4 w-4" />
                <span className="flex-1 truncate">{authState.name || "Хэрэглэгч"}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <button
                type="button"
                onClick={() => setLogoutModal(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Гарах</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onNavigate}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl"
            >
              <LogIn className="h-4 w-4" />
              Нэвтрэх
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-border bg-background lg:hidden"
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

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModal} onOpenChange={(v) => !loggingOut && setLogoutModal(v)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Гарах уу?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Та системээс гарахдаа итгэлтэй байна уу?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLogoutModal(false)}
              disabled={loggingOut}
              className="rounded-xl"
            >
              Цуцлах
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl"
            >
              {loggingOut ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Гарч байна...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Гарах
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
