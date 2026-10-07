"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js so the browser installs the service worker on
 * every page load. Idempotent — browsers de-dupe by URL. Only runs
 * in production so `next dev`'s hot reload isn't broken by cached
 * chunks.
 */
export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        console.warn("[pwa] SW registration failed", err);
      });
  }, []);

  return null;
}
