"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Pause,
  Play,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HotSpot {
  pitch: number;
  yaw: number;
  text: string;
  color?: string;
}

interface Props {
  panoramaUrl?: string | null;
  title?: string;
  hotSpots?: HotSpot[];
  className?: string;
}

export default function PanoramaViewer({
  panoramaUrl,
  title,
  hotSpots = [],
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeHotSpot, setActiveHotSpot] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !panoramaUrl) return;

    let viewer: any = null;
    let mounted = true;

    const init = async () => {
      // Pannellum attaches to window — load dynamically from public/
      if (typeof window === "undefined") return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w.pannellum) {
        await new Promise<void>((resolve) => {
          const existing = document.querySelector("script[src='/pannellum.js']");
          if (existing) { resolve(); return; }
          const s = document.createElement("script");
          s.src = "/pannellum.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }
      const pannellum = w.pannellum;
      if (!pannellum || !mounted || !containerRef.current) return;

      // Clean up previous
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch {}
      }

      try {
        viewer = pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: panoramaUrl,
          autoLoad: true,
          autoRotate: isAutoRotate ? -2 : 0,
          showControls: false,
          hotSpots: hotSpots.map((hs, i) => ({
            pitch: hs.pitch,
            yaw: hs.yaw,
            type: "info",
            text: hs.text,
            createTooltipFunc: (hotSpotDiv: HTMLElement) => {
              hotSpotDiv.innerHTML = `
                <div style="
                  background: ${hs.color || "hsl(var(--primary))"};
                  color: white;
                  padding: 4px 10px;
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 600;
                  white-space: nowrap;
                  cursor: pointer;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">${hs.text}</div>
              `;
              hotSpotDiv.style.width = "auto";
              hotSpotDiv.style.height = "auto";
            },
            createTooltipArgs: hs.text,
          })),
          compass: true,
        });

        viewer.on("load", () => {
          if (mounted) setIsLoaded(true);
        });

        viewerRef.current = viewer;
      } catch (err) {
        console.error("Pannellum init error:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch {}
        viewerRef.current = null;
      }
    };
  }, [panoramaUrl, hotSpots]);

  // Update autorotate
  useEffect(() => {
    if (viewerRef.current) {
      try {
        viewerRef.current.setAutoRotate(isAutoRotate ? -2 : 0);
      } catch {}
    }
  }, [isAutoRotate]);

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // No panoramic image — show interactive CSS 3D fallback
  if (!panoramaUrl) {
    return <InteractiveFallback title={title} className={className} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* 360° Viewer */}
      <div
        ref={containerRef}
        className="aspect-[16/9] w-full bg-black"
        style={{ minHeight: 400 }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-white/70">Ачаалж байна...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        {/* Title */}
        {title && (
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2 text-white">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Гараар эргүүлнэ үү</span>
            </div>
            <div className="mt-0.5 text-sm font-semibold">{title}</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAutoRotate((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            title={isAutoRotate ? "Автомат эргүүлэхийг зогсоох" : "Автомат эргүүлэх"}
          >
            {isAutoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            title="Дэлгэрүүлэх"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 360° badge */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
        <RotateCw className="h-3 w-3" />
        360°
      </div>
    </div>
  );
}

/* ── Interactive CSS 3D Fallback (when no panorama image) ── */
function InteractiveFallback({ title, className }: { title?: string; className?: string }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const animRef = useRef<number>();

  // Auto rotate
  useEffect(() => {
    if (!autoRotate) { cancelAnimationFrame(animRef.current!); return; }
    let angle = rotation.y;
    const animate = () => {
      angle += 0.15;
      setRotation((r) => ({ ...r, y: angle }));
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current!);
  }, [autoRotate]);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setRotation((r) => ({
      x: Math.max(-30, Math.min(30, r.x - dy * 0.3)),
      y: r.y + dx * 0.3,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => setIsDragging(false);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", className)}>
      {/* 3D Scene */}
      <div
        className="aspect-[16/9] w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ perspective: 800 }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          {/* Floor */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              transform: "rotateX(90deg) translateZ(-200px)",
              transformOrigin: "center center",
            }}
          />

          {/* Walls */}
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute"
              style={{
                width: "100%",
                height: "100%",
                transform: `rotateY(${deg}deg) translateZ(400px)`,
                transformOrigin: "center center",
                background: `linear-gradient(180deg, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.15) 100%)`,
                borderLeft: "1px solid rgba(255,255,255,0.05)",
              }}
            />
          ))}

          {/* Center element */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-primary/20 p-8 ring-2 ring-primary/30">
              <RotateCw className="h-20 w-20 text-primary/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
        <RotateCw className="h-3 w-3" />
        360° DEMO
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        {title && (
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2 text-white">
              <Move className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Гараар эргүүлнэ үү</span>
            </div>
            <div className="mt-0.5 text-sm font-semibold">{title}</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-black/60 px-3 text-xs font-medium text-white backdrop-blur transition hover:bg-black/80"
        >
          {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoRotate ? "Зогсоох" : "Эргүүлэх"}
        </button>
      </div>

      {/* Instruction */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="text-white/30 text-sm font-medium"
        >
          ← Гараар зүүн баруун руу чирнэ үү →
        </motion.div>
      </div>
    </div>
  );
}
