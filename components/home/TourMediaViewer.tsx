"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pannellum-based 360 viewer stays client-only.
const PanoramaViewer = dynamic(() => import("./PanoramaViewer"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
  ),
});

interface Props {
  panoramaUrl?: string | null;
  videoUrl?: string | null;
  photoUrl?: string | null;
  title?: string;
  className?: string;
}

/**
 * Picks the best renderer for whatever media the tour room has:
 *   1. panoramaUrl → true equirectangular 360 (Insta360/GoPro Max)
 *   2. videoUrl    → autoplay/loop MP4 (drone or phone walkthrough)
 *   3. photoUrl    → single photo with pan + zoom (iPhone Pano, drone still)
 *   4. nothing     → PanoramaViewer's CSS-3D interactive fallback
 */
export default function TourMediaViewer(props: Props) {
  if (props.panoramaUrl) {
    return (
      <PanoramaViewer
        panoramaUrl={props.panoramaUrl}
        title={props.title}
        className={props.className}
      />
    );
  }
  if (props.videoUrl) {
    return <VideoRenderer url={props.videoUrl} title={props.title} className={props.className} />;
  }
  if (props.photoUrl) {
    return <PhotoRenderer url={props.photoUrl} title={props.title} className={props.className} />;
  }
  // Falls through to the CSS-3D fallback baked into PanoramaViewer.
  return <PanoramaViewer title={props.title} className={props.className} />;
}

// ── Video renderer (DJI Neo, iPhone walkthrough) ──────────────

function VideoRenderer({
  url,
  title,
  className,
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={cn("relative overflow-hidden rounded-xl bg-black", className)}
    >
      <video
        ref={videoRef}
        src={url}
        className="aspect-[16/9] w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        style={{ minHeight: 400 }}
      />

      {/* Media-type badge (helps parents understand this isn't a photo) */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
        <Sparkles className="h-3 w-3" />
        БИЧЛЭГ
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        {title && (
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/70">
              Одоо үзэж буй
            </div>
            <div className="mt-0.5 text-sm font-semibold text-white">{title}</div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            title={playing ? "Түр зогсоох" : "Тоглуулах"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={toggleFs}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            title="Дэлгэрүүлэх"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo renderer (iPhone Pano, single drone shot) ───────────

function PhotoRenderer({
  url,
  title,
  className,
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const last = useRef({ x: 0, y: 0 });
  const wrap = useRef<HTMLDivElement>(null);

  const onDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => setDragging(false);

  return (
    <div
      ref={wrap}
      className={cn("relative overflow-hidden rounded-xl bg-black", className)}
    >
      <div
        className={cn(
          "aspect-[16/9] w-full overflow-hidden",
          zoom > 1 && dragging && "cursor-grabbing",
          zoom > 1 && !dragging && "cursor-grab",
        )}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{ minHeight: 400 }}
      >
        <motion.img
          src={url}
          alt={title ?? ""}
          className="h-full w-full select-none object-cover"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          draggable={false}
        />
      </div>

      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
        <Sparkles className="h-3 w-3" />
        ЗУРАГ
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        {title && (
          <div className="rounded-lg bg-black/60 px-3 py-2 backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/70">
              {zoom > 1 ? "Чирж хөдөлгөнө үү" : "Томруулж болно"}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-white">{title}</div>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setZoom((z) => Math.max(1, z - 0.5));
              if (zoom <= 1.5) setPos({ x: 0, y: 0 });
            }}
            disabled={zoom <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-40"
            title="Багасгах"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            disabled={zoom >= 3}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-40"
            title="Томруулах"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
