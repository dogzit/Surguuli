"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [displayPath, setDisplayPath] = useState(pathname);

  useEffect(() => {
    setLoading(false);
    setDisplayPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Skip loading overlay on admin/dashboard pages — they load via server queries
      if (pathname.startsWith("/dashboard")) return;
      const target = (e.target as HTMLElement).closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (href === displayPath) return;
      setLoading(true);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [displayPath, pathname]);

  const isAdminPage = pathname.startsWith("/dashboard");

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed z-[10]"
          style={{
            top: "57px",
            left: isAdminPage ? "256px" : "0",
            right: 0,
            bottom: 0,
            backgroundColor: "hsl(var(--background) / 0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            {/* Content skeleton cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl border border-border bg-card"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
