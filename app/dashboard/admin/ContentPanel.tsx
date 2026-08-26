"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, Megaphone, Newspaper, MapPin,
  Award, HelpCircle, Calendar, MessageSquare, Users,
  ChevronDown, Eye, X, Loader2, Check, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, matchesSearch } from "@/lib/utils";
import {
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  createNewsItem, updateNewsItem, deleteNewsItem,
  createTourRoom, updateTourRoom, deleteTourRoom,
  createGalleryImage, updateGalleryImage, deleteGalleryImage,
  createAchievement, updateAchievement, deleteAchievement,
  createFaq, updateFaq, deleteFaq,
  createEvent, updateEvent, deleteEvent,
  createTestimonial, updateTestimonial, deleteTestimonial,
  createClub, updateClub, deleteClub,
} from "@/app/actions/admin";

export interface AdminAnnouncement { id: string; text: string; order: number; active: boolean; }
export interface AdminNewsItem { id: string; tag: string; title: string; excerpt: string; date: string; order: number; }
export interface AdminTourRoom { id: string; slug: string; label: string; subtitle: string; description: string; icon: string; panoramaUrl: string | null; order: number; }
export interface AdminGalleryImage { id: string; title: string; url: string; category: string; order: number; }
export interface AdminAchievement { id: string; name: string; grade: string | null; award: string; year: number; category: string; image: string | null; order: number; }
export interface AdminFaq { id: string; question: string; answer: string; order: number; }
export interface AdminEvent { id: string; title: string; date: string; time: string | null; location: string | null; description: string; type: string; order: number; }
export interface AdminTestimonial { id: string; name: string; role: string; text: string; rating: number; order: number; }
export interface AdminClub { id: string; name: string; description: string; teacher: string | null; schedule: string | null; icon: string | null; order: number; }

export default function ContentPanel(props: {
  announcements: AdminAnnouncement[];
  news: AdminNewsItem[];
  tourRooms: AdminTourRoom[];
  gallery: AdminGalleryImage[];
  achievements: AdminAchievement[];
  faqs: AdminFaq[];
  events: AdminEvent[];
  testimonials: AdminTestimonial[];
  clubs: AdminClub[];
}) {
  return (
    <Tabs defaultValue="announcements" className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-9">
        <TabsTrigger value="announcements"><Megaphone className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Зарлал</span></TabsTrigger>
        <TabsTrigger value="news"><Newspaper className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Мэдээ</span></TabsTrigger>
        <TabsTrigger value="tour"><MapPin className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Аялал</span></TabsTrigger>
        <TabsTrigger value="gallery"><Megaphone className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Галерей</span></TabsTrigger>
        <TabsTrigger value="achievements"><Award className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Амжилт</span></TabsTrigger>
        <TabsTrigger value="faq"><HelpCircle className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Асуулт</span></TabsTrigger>
        <TabsTrigger value="events"><Calendar className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Үйл явдал</span></TabsTrigger>
        <TabsTrigger value="testimonials"><MessageSquare className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Сэтгэгдэл</span></TabsTrigger>
        <TabsTrigger value="clubs"><Users className="mr-1 h-3 w-3" /><span className="hidden sm:inline">Дугуйлан</span></TabsTrigger>
      </TabsList>
      <TabsContent value="announcements" className="mt-4"><SimpleListPanel items={props.announcements} type="announcement" /></TabsContent>
      <TabsContent value="news" className="mt-4"><SimpleListPanel items={props.news} type="news" /></TabsContent>
      <TabsContent value="tour" className="mt-4"><SimpleListPanel items={props.tourRooms} type="tour" /></TabsContent>
      <TabsContent value="gallery" className="mt-4"><SimpleListPanel items={props.gallery} type="gallery" /></TabsContent>
      <TabsContent value="achievements" className="mt-4"><SimpleListPanel items={props.achievements} type="achievement" /></TabsContent>
      <TabsContent value="faq" className="mt-4"><SimpleListPanel items={props.faqs} type="faq" /></TabsContent>
      <TabsContent value="events" className="mt-4"><SimpleListPanel items={props.events} type="event" /></TabsContent>
      <TabsContent value="testimonials" className="mt-4"><SimpleListPanel items={props.testimonials} type="testimonial" /></TabsContent>
      <TabsContent value="clubs" className="mt-4"><SimpleListPanel items={props.clubs} type="club" /></TabsContent>
    </Tabs>
  );
}

const TYPE_CONFIG: Record<string, { icon: typeof Megaphone; gradient: string; emoji: string }> = {
  announcement: { icon: Megaphone, gradient: "from-blue-500 to-cyan-500", emoji: "📢" },
  news: { icon: Newspaper, gradient: "from-violet-500 to-purple-500", emoji: "📰" },
  tour: { icon: MapPin, gradient: "from-emerald-500 to-teal-500", emoji: "🗺️" },
  gallery: { icon: Eye, gradient: "from-pink-500 to-rose-500", emoji: "🖼️" },
  achievement: { icon: Award, gradient: "from-amber-500 to-orange-500", emoji: "🏆" },
  faq: { icon: HelpCircle, gradient: "from-indigo-500 to-blue-500", emoji: "❓" },
  event: { icon: Calendar, gradient: "from-orange-500 to-red-500", emoji: "📅" },
  testimonial: { icon: MessageSquare, gradient: "from-teal-500 to-cyan-500", emoji: "💬" },
  club: { icon: Users, gradient: "from-cyan-500 to-blue-500", emoji: "👥" },
};

const TITLE_MAP: Record<string, string> = {
  announcement: "Зарлал", news: "Мэдээ", tour: "Зогсолол", gallery: "Зураг",
  achievement: "Амжилт", faq: "Асуулт", event: "Үйл явдал", testimonial: "Сэтгэгдэл", club: "Дугуйлан",
};

function getLabel(item: any) {
  return String(item.title ?? item.text ?? item.question ?? item.name ?? item.slug ?? "—");
}

function DetailView({ item, type }: { item: any; type: string }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.announcement;
  if (type === "announcement") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Текст</div>
          <div className="font-medium leading-relaxed">{item.text}</div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-background/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Дараалал</div>
            <div className="font-mono text-lg font-bold tabular-nums">{item.order}</div>
          </div>
          <div className="flex-1 rounded-xl bg-background/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Төлөв</div>
            <div className={cn("font-semibold", item.active ? "text-emerald-500" : "text-muted-foreground")}>
              {item.active ? "● Идэвхтэй" : "○ Идэвхгүй"}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (type === "news") {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{item.tag}</span>
          <span className="text-muted-foreground tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span>
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Гарчиг</div>
          <div className="font-semibold">{item.title}</div>
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Товч</div>
          <div className="text-muted-foreground leading-relaxed">{item.excerpt}</div>
        </div>
      </div>
    );
  }
  if (type === "faq") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">❓ Асуулт</div>
          <div className="font-semibold">{item.question}</div>
        </div>
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">💬 Хариулт</div>
          <div className="text-muted-foreground leading-relaxed">{item.answer}</div>
        </div>
      </div>
    );
  }
  if (type === "event") {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{item.type}</span>
          <span className="text-muted-foreground tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span>
          {item.time && <span className="text-muted-foreground">{item.time}</span>}
          {item.location && <span className="text-muted-foreground">📍 {item.location}</span>}
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Тайлбар</div>
          <div className="text-muted-foreground leading-relaxed">{item.description}</div>
        </div>
      </div>
    );
  }
  if (type === "testimonial") {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
            {item.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.role}</div>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={cn("text-lg", i < item.rating ? "text-amber-400" : "text-muted/30")}>★</span>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-background/50 p-4 italic text-muted-foreground border-l-4 border-primary/30">
          &ldquo;{item.text}&rdquo;
        </div>
      </div>
    );
  }
  if (type === "achievement") {
    return (
      <div className="space-y-3 text-sm">
        {item.image && (
          <div className="rounded-xl overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
          </div>
        )}
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Нэр</div>
          <div className="font-semibold">{item.name}</div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Шагнал</div>
            <div className="font-semibold text-amber-600">{item.award}</div>
          </div>
          <div className="flex-1 rounded-xl bg-background/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Он</div>
            <div className="font-mono font-bold tabular-nums">{item.year}</div>
          </div>
        </div>
      </div>
    );
  }
  if (type === "tour") {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex gap-2 flex-wrap">
          <span className="font-mono text-xs bg-background/50 px-2 py-1 rounded-lg">{item.slug}</span>
          <span className="font-mono text-xs bg-background/50 px-2 py-1 rounded-lg">{item.icon}</span>
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Нэр</div>
          <div className="font-semibold">{item.label}</div>
          <div className="mt-1 text-muted-foreground">{item.subtitle}</div>
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Тайлбар</div>
          <div className="text-muted-foreground leading-relaxed">{item.description}</div>
        </div>
      </div>
    );
  }
  if (type === "club") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Нэр</div>
          <div className="font-semibold">{item.name}</div>
        </div>
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Тайлбар</div>
          <div className="text-muted-foreground leading-relaxed">{item.description}</div>
        </div>
        <div className="flex gap-3">
          {item.teacher && (
            <div className="flex-1 rounded-xl bg-background/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Багш</div>
              <div className="font-medium">{item.teacher}</div>
            </div>
          )}
          {item.schedule && (
            <div className="flex-1 rounded-xl bg-background/50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Хуваарь</div>
              <div className="font-medium">{item.schedule}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (type === "gallery") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-background/50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Нэр</div>
          <div className="font-semibold">{item.title}</div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-background/50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Ангилал</div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.category}</span>
          </div>
        </div>
      </div>
    );
  }
  return <div className="text-sm text-muted-foreground">Мэдээлэл байхгүй</div>;
}

export function SimpleListPanel({ items, type }: { items: any[]; type: string }) {
  const [q, setQ] = useState("");
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState<Record<string, string>>({});

  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.announcement;

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((item) => matchesSearch(getLabel(item), q));
  }, [items, q]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    start(async () => {
      let res;
      switch (type) {
        case "announcement": res = await deleteAnnouncement(deleteTarget.id as string); break;
        case "news": res = await deleteNewsItem(deleteTarget.id as string); break;
        case "tour": res = await deleteTourRoom(deleteTarget.id as string); break;
        case "gallery": res = await deleteGalleryImage(deleteTarget.id as string); break;
        case "achievement": res = await deleteAchievement(deleteTarget.id as string); break;
        case "faq": res = await deleteFaq(deleteTarget.id as string); break;
        case "event": res = await deleteEvent(deleteTarget.id as string); break;
        case "testimonial": res = await deleteTestimonial(deleteTarget.id as string); break;
        case "club": res = await deleteClub(deleteTarget.id as string); break;
        default: return;
      }
      if (res?.ok) { toast.success(res.message); setDeleteTarget(null); } else toast.error(res?.error);
    });
  };

  const handleCreate = () => {
    start(async () => {
      let res;
      switch (type) {
        case "announcement": res = await createAnnouncement({ text: form.text ?? "", order: 0 }); break;
        case "news": res = await createNewsItem({ tag: form.tag ?? "", title: form.title ?? "", excerpt: form.excerpt ?? "" }); break;
        case "tour": res = await createTourRoom({ slug: form.slug ?? "", label: form.label ?? "", subtitle: form.subtitle ?? "", description: form.description ?? "", icon: form.icon ?? "DoorOpen", panoramaUrl: form.panoramaUrl || null }); break;
        case "gallery": res = await createGalleryImage({ title: form.title ?? "", url: form.url ?? "", category: form.category ?? "general" }); break;
        case "achievement": res = await createAchievement({ name: form.name ?? "", grade: form.grade, award: form.award ?? "", year: Number(form.year) || 2025, category: form.category ?? "olimpiad", image: form.image || undefined }); break;
        case "faq": res = await createFaq({ question: form.question ?? "", answer: form.answer ?? "" }); break;
        case "event": res = await createEvent({ title: form.title ?? "", date: form.date ?? new Date().toISOString(), time: form.time, location: form.location, description: form.description ?? "", type: form.type ?? "school" }); break;
        case "testimonial": res = await createTestimonial({ name: form.name ?? "", role: form.role ?? "", text: form.text ?? "", rating: Number(form.rating) || 5 }); break;
        case "club": res = await createClub({ name: form.name ?? "", description: form.description ?? "", teacher: form.teacher, schedule: form.schedule, icon: form.icon }); break;
        default: return;
      }
      if (res?.ok) { toast.success(res.message); setCreateOpen(false); setForm({}); } else toast.error(res?.error);
    });
  };

  return (
    <div className="space-y-5">
      {/* Search + Create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Хайх..."
            className="h-11 pl-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
          />
        </div>
        <Button
          onClick={() => { setForm({}); setCreateOpen(true); }}
          className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Нэмэх
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>
          Нийт <span className="font-semibold text-foreground">{items.length}</span> бичлэг
          {q.trim() && (
            <> · <span className="font-semibold text-foreground">{filtered.length}</span> олдлоо</>
          )}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            return (
              <motion.div
                key={String(item.id)}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.25, delay: idx * 0.02, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300",
                  isExpanded ? "border-primary/30 shadow-lg" : "border-border/40 hover:border-primary/20 hover:shadow-md",
                )}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex cursor-pointer items-center gap-4 p-4 sm:p-5"
                >
                  {/* Icon with gradient */}
                  <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md`}>
                    <span className="text-lg">{config.emoji}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                      {getLabel(item)}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.tag && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {item.tag}
                        </span>
                      )}
                      {item.year && <span className="tabular-nums">{item.year}</span>}
                      {item.date && <span className="tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span>}
                      {item.active !== undefined && (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          item.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground",
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", item.active ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                          {item.active ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                      )}
                      {item.rating && (
                        <span className="text-amber-400 text-sm">{"★".repeat(item.rating)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditTarget(item); }}
                      disabled={pending}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all hover:text-foreground hover:bg-accent"
                      title="Засах"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                      disabled={pending}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10"
                      title="Устгах"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Chevron */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  </motion.div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="border-t border-border/50 bg-muted/20 p-4 sm:p-5">
                        <DetailView item={item} type={type} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-dashed border-border/50 bg-muted/20 px-4 py-16 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-2xl">{config.emoji}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Бичлэг байхгүй</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Дээрх товчийг дарж шинэ нэмнэ үү</p>
          </motion.div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && !pending && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
                <Plus className="h-4 w-4" />
              </div>
              Шинэ {TITLE_MAP[type]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {type === "announcement" && <div className="space-y-1.5"><Label>Текст</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>}
            {type === "news" && (<>
              <div className="space-y-1.5"><Label>Таг</Label><Input value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Захиргаа" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Гарчиг</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Товч</Label><Input value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="rounded-xl" /></div>
            </>)}
            {type === "tour" && (<>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Дэд нэр</Label><Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="DoorOpen" className="rounded-xl" /></div>
            </>)}
            {type === "gallery" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Зурагны URL</Label><Input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Ангилал</Label>
                <Select value={form.category ?? "school"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Сургууль</SelectItem>
                    <SelectItem value="events">Арга хэмжээ</SelectItem>
                    <SelectItem value="sports">Спорт</SelectItem>
                    <SelectItem value="academic">Сургалт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>)}
            {type === "achievement" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Анги</Label><Input value={form.grade ?? ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="11" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Шагнал</Label><Input value={form.award ?? ""} onChange={(e) => setForm({ ...form, award: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Он</Label><Input type="text" inputMode="numeric" pattern="[0-9]*" value={form.year ?? "2025"} onChange={(e) => setForm({ ...form, year: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Ангилал</Label>
                <Select value={form.category ?? "olimpiad"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="olimpiad">Олимпиад</SelectItem>
                    <SelectItem value="competition">Тэмцээн</SelectItem>
                    <SelectItem value="academic">Сургалт</SelectItem>
                    <SelectItem value="other">Бусад</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Зураг</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setForm({ ...form, image: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/30 p-4 transition-colors hover:border-primary/30 hover:bg-muted/50">
                    {form.image ? (
                      <div className="relative">
                        <img src={form.image} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: "" }); }} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">Зураг нэмэх</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>)}
            {type === "faq" && (<>
              <div className="space-y-1.5"><Label>Асуулт</Label><Input value={form.question ?? ""} onChange={(e) => setForm({ ...form, question: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Хариулт</Label><Input value={form.answer ?? ""} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="rounded-xl" /></div>
            </>)}
            {type === "event" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Огноо</Label><Input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Цаг</Label><Input value={form.time ?? ""} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="09:00" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Газар</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Төрөл</Label>
                <Select value={form.type ?? "school"} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Сургууль</SelectItem>
                    <SelectItem value="academic">Сургалт</SelectItem>
                    <SelectItem value="sports">Спорт</SelectItem>
                    <SelectItem value="cultural">Соёл</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>)}
            {type === "testimonial" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Хариуцсан</Label><Input value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="3А ангийн ээж" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Сэтгэгдэл</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Үнэлгээ (1-5)</Label><Input type="text" inputMode="numeric" pattern="[1-5]" value={form.rating ?? "5"} onChange={(e) => setForm({ ...form, rating: e.target.value.replace(/[^1-5]/g, "").slice(0, 1) })} className="rounded-xl" /></div>
            </>)}
            {type === "club" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Багш</Label><Input value={form.teacher ?? ""} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Хуваарь</Label><Input value={form.schedule ?? ""} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Даваа, Лхагва 16:00" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Dumbbell" className="rounded-xl" /></div>
            </>)}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={pending} className="rounded-xl">Болих</Button>
            <Button onClick={handleCreate} disabled={pending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Үүсгэх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditDialog item={editTarget} type={type} open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)} />

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Устгах уу?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{deleteTarget ? getLabel(deleteTarget) : ""}&rdquo; -г устгах уу?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending} className="rounded-xl">Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending} className="rounded-xl">Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Edit Dialog ──────────────────────────────────────────────
function EditDialog({
  item,
  type,
  open,
  onOpenChange,
}: {
  item: any | null;
  type: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.announcement;

  // Sync form when item changes
  if (item && !pending && Object.keys(form).length === 0) {
    const initialValues: Record<string, string> = {};
    if (item.text !== undefined) initialValues.text = item.text;
    if (item.title !== undefined) initialValues.title = item.title;
    if (item.tag !== undefined) initialValues.tag = item.tag;
    if (item.excerpt !== undefined) initialValues.excerpt = item.excerpt;
    if (item.question !== undefined) initialValues.question = item.question;
    if (item.answer !== undefined) initialValues.answer = item.answer;
    if (item.slug !== undefined) initialValues.slug = item.slug;
    if (item.label !== undefined) initialValues.label = item.label;
    if (item.subtitle !== undefined) initialValues.subtitle = item.subtitle;
    if (item.description !== undefined) initialValues.description = item.description;
    if (item.icon !== undefined) initialValues.icon = item.icon;
    if (item.name !== undefined) initialValues.name = item.name;
    if (item.award !== undefined) initialValues.award = item.award;
    if (item.grade !== undefined) initialValues.grade = item.grade ?? "";
    if (item.year !== undefined) initialValues.year = String(item.year);
    if (item.category !== undefined) initialValues.category = item.category;
    if (item.url !== undefined) initialValues.url = item.url;
    if (item.role !== undefined) initialValues.role = item.role;
    if (item.rating !== undefined) initialValues.rating = String(item.rating);
    if (item.teacher !== undefined) initialValues.teacher = item.teacher ?? "";
    if (item.schedule !== undefined) initialValues.schedule = item.schedule ?? "";
    if (item.location !== undefined) initialValues.location = item.location ?? "";
    if (item.time !== undefined) initialValues.time = item.time ?? "";
    if (item.date !== undefined) initialValues.date = item.date?.split("T")[0] ?? "";
    if (item.type !== undefined) initialValues.type = item.type;
    if (Object.keys(initialValues).length > 0) setForm(initialValues);
  }

  const handleSubmit = () => {
    if (!item) return;
    start(async () => {
      let res;
      switch (type) {
        case "announcement": res = await updateAnnouncement(item.id, { text: form.text }); break;
        case "news": res = await updateNewsItem(item.id, { tag: form.tag, title: form.title, excerpt: form.excerpt }); break;
        case "tour": res = await updateTourRoom(item.id, { label: form.label, subtitle: form.subtitle, description: form.description, icon: form.icon }); break;
        case "gallery": res = await updateGalleryImage(item.id, { title: form.title, category: form.category }); break;
        case "achievement": res = await updateAchievement(item.id, { name: form.name, grade: form.grade, award: form.award, year: Number(form.year), category: form.category, image: form.image }); break;
        case "faq": res = await updateFaq(item.id, { question: form.question, answer: form.answer }); break;
        case "event": res = await updateEvent(item.id, { title: form.title, date: form.date, time: form.time, location: form.location, description: form.description, type: form.type }); break;
        case "testimonial": res = await updateTestimonial(item.id, { name: form.name, role: form.role, text: form.text, rating: Number(form.rating) }); break;
        case "club": res = await updateClub(item.id, { name: form.name, description: form.description, teacher: form.teacher, schedule: form.schedule, icon: form.icon }); break;
        default: return;
      }
      if (res?.ok) { toast.success(res.message); setForm({}); onOpenChange(false); } else toast.error(res?.error);
    });
  };

  const close = () => { setForm({}); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !pending && close()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
              <Pencil className="h-4 w-4" />
            </div>
            Засах — {TITLE_MAP[type]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {type === "announcement" && <div className="space-y-1.5"><Label>Текст</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>}
          {type === "news" && (<>
            <div className="space-y-1.5"><Label>Таг</Label><Input value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Гарчиг</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Товч</Label><Input value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="rounded-xl" /></div>
          </>)}
          {type === "faq" && (<>
            <div className="space-y-1.5"><Label>Асуулт</Label><Input value={form.question ?? ""} onChange={(e) => setForm({ ...form, question: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Хариулт</Label><Input value={form.answer ?? ""} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="rounded-xl" /></div>
          </>)}
          {type === "event" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Огноо</Label><Input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Цаг</Label><Input value={form.time ?? ""} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Газар</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
          </>)}
          {type === "testimonial" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Хариуцсан</Label><Input value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Сэтгэгдэл</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Үнэлгээ</Label><Input type="text" inputMode="numeric" value={form.rating ?? "5"} onChange={(e) => setForm({ ...form, rating: e.target.value.replace(/[^1-5]/g, "").slice(0, 1) })} className="rounded-xl" /></div>
          </>)}
          {type === "achievement" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Анги</Label><Input value={form.grade ?? ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Шагнал</Label><Input value={form.award ?? ""} onChange={(e) => setForm({ ...form, award: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Он</Label><Input type="text" inputMode="numeric" value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })} className="rounded-xl" /></div>
            <div className="space-y-1.5">
              <Label>Зураг</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setForm({ ...form, image: ev.target?.result as string });
                    reader.readAsDataURL(file);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/30 p-4 transition-colors hover:border-primary/30 hover:bg-muted/50">
                  {form.image ? (
                    <div className="relative">
                      <img src={form.image} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: "" }); }} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">Зураг нэмэх</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>)}
          {type === "tour" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Дэд нэр</Label><Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="rounded-xl" /></div>
          </>)}
          {type === "club" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Багш</Label><Input value={form.teacher ?? ""} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Хуваарь</Label><Input value={form.schedule ?? ""} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="rounded-xl" /></div>
          </>)}
          {type === "gallery" && (<>
            <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Ангилал</Label>
              <Select value={form.category ?? "school"} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Сургууль</SelectItem>
                  <SelectItem value="events">Арга хэмжээ</SelectItem>
                  <SelectItem value="sports">Спорт</SelectItem>
                  <SelectItem value="academic">Сургалт</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>)}
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={close} disabled={pending} className="rounded-xl">Болих</Button>
          <Button onClick={handleSubmit} disabled={pending} className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Хадгалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
