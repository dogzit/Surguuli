"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileSignature,
  GraduationCap,
  Newspaper,
  Wrench,
  ArrowLeft,
  Menu,
  X,
  Award,
  HelpCircle,
  Calendar,
  MessageSquare,
  Image,
  KeyRound,
} from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/users", label: "Хэрэглэгчид", icon: Users },
  { href: "/dashboard/admin/signatures", label: "Гарын үсэг", icon: FileSignature },
  { href: "/dashboard/admin/classrooms", label: "Ангиуд", icon: GraduationCap },
  { href: "/dashboard/admin/students", label: "Сурагчид", icon: Users },
  { href: "/dashboard/admin/content", label: "Контент", icon: Newspaper },
  { href: "/dashboard/admin/gallery", label: "Галерей", icon: Image },
  { href: "/dashboard/admin/achievements", label: "Амжилт", icon: Award },
  { href: "/dashboard/admin/faq", label: "Асуулт", icon: HelpCircle },
  { href: "/dashboard/admin/events", label: "Үйл явдал", icon: Calendar },
  { href: "/dashboard/admin/testimonials", label: "Сэтгэгдэл", icon: MessageSquare },
  { href: "/dashboard/admin/codes", label: "Кодууд", icon: KeyRound },
  { href: "/dashboard/admin/bulk", label: "Үйлдлүүд", icon: Wrench },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="border-b border-border/50 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <Logo size={28} />
          <div>
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-500">
              ADMIN
            </span>
            <div className="text-xs font-semibold text-foreground">Dashboard</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t border-border/50 px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Сайт руу буцах</span>
        </Link>
      </div>
    </>
  );
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card/50 lg:flex lg:flex-col">
        <NavLinks />
      </aside>
    </>
  );
}
