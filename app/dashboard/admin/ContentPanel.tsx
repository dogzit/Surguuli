"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus, Search, Pencil, Trash2, Megaphone, Newspaper, MapPin,
  Award, HelpCircle, Calendar, MessageSquare, Users,
  ChevronDown, ChevronRight, Eye, Save, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, matchesSearch } from "@/lib/utils";
import {
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  createNewsItem, updateNewsItem, deleteNewsItem,
  createTourRoom, updateTourRoom, deleteTourRoom,
  createGalleryImage, deleteGalleryImage,
  createAchievement, deleteAchievement,
  createFaq, updateFaq, deleteFaq,
  createEvent, deleteEvent,
  createTestimonial, deleteTestimonial,
  createClub, deleteClub,
} from "@/app/actions/admin";

export interface AdminAnnouncement { id: string; text: string; order: number; active: boolean; }
export interface AdminNewsItem { id: string; tag: string; title: string; excerpt: string; date: string; order: number; }
export interface AdminTourRoom { id: string; slug: string; label: string; subtitle: string; description: string; icon: string; panoramaUrl: string | null; order: number; }
export interface AdminGalleryImage { id: string; title: string; url: string; category: string; order: number; }
export interface AdminAchievement { id: string; name: string; grade: string | null; award: string; year: number; category: string; order: number; }
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

const TYPE_ICONS: Record<string, typeof Megaphone> = {
  announcement: Megaphone, news: Newspaper, tour: MapPin, gallery: Eye,
  achievement: Award, faq: HelpCircle, event: Calendar, testimonial: MessageSquare, club: Users,
};

const TYPE_COLORS: Record<string, string> = {
  announcement: "bg-blue-500/10 text-blue-500",
  news: "bg-violet-500/10 text-violet-500",
  tour: "bg-emerald-500/10 text-emerald-500",
  gallery: "bg-pink-500/10 text-pink-500",
  achievement: "bg-amber-500/10 text-amber-500",
  faq: "bg-indigo-500/10 text-indigo-500",
  event: "bg-orange-500/10 text-orange-500",
  testimonial: "bg-teal-500/10 text-teal-500",
  club: "bg-cyan-500/10 text-cyan-500",
};

const TITLE_MAP: Record<string, string> = {
  announcement: "Зарлал", news: "Мэдээ", tour: "Зогсолол", gallery: "Зураг",
  achievement: "Амжилт", faq: "Асуулт", event: "Үйл явдал", testimonial: "Сэтгэгдэл", club: "Дугуйлан",
};

function getLabel(item: any) {
  return String(item.title ?? item.text ?? item.question ?? item.name ?? item.slug ?? "—");
}

// Detail view for each type
function DetailView({ item, type }: { item: any; type: string }) {
  if (type === "announcement") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Текст:</span> <span className="font-medium">{item.text}</span></div>
        <div><span className="text-muted-foreground">Дараалал:</span> <span className="font-medium tabular-nums">{item.order}</span></div>
        <div><span className="text-muted-foreground">Төлөв:</span> <span className={cn("font-medium", item.active ? "text-emerald-600" : "text-muted-foreground")}>{item.active ? "Идэвхтэй" : "Идэвхгүй"}</span></div>
      </div>
    );
  }
  if (type === "news") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Таг:</span> <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.tag}</span></div>
        <div><span className="text-muted-foreground">Гарчиг:</span> <span className="font-medium">{item.title}</span></div>
        <div><span className="text-muted-foreground">Товч:</span> <span className="text-muted-foreground">{item.excerpt}</span></div>
        <div><span className="text-muted-foreground">Огноо:</span> <span className="font-medium tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span></div>
      </div>
    );
  }
  if (type === "tour") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Slug:</span> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.slug}</span></div>
        <div><span className="text-muted-foreground">Нэр:</span> <span className="font-medium">{item.label}</span></div>
        <div><span className="text-muted-foreground">Дэд нэр:</span> <span className="text-muted-foreground">{item.subtitle}</span></div>
        <div><span className="text-muted-foreground">Тайлбар:</span> <span className="text-muted-foreground">{item.description}</span></div>
        <div><span className="text-muted-foreground">Icon:</span> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.icon}</span></div>
        {item.panoramaUrl && <div><span className="text-muted-foreground">360° URL:</span> <span className="text-xs text-primary break-all">{item.panoramaUrl}</span></div>}
      </div>
    );
  }
  if (type === "gallery") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Нэр:</span> <span className="font-medium">{item.title}</span></div>
        <div><span className="text-muted-foreground">URL:</span> <span className="text-xs text-primary break-all">{item.url}</span></div>
        <div><span className="text-muted-foreground">Ангилал:</span> <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.category}</span></div>
      </div>
    );
  }
  if (type === "achievement") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Нэр:</span> <span className="font-medium">{item.name}</span></div>
        {item.grade && <div><span className="text-muted-foreground">Анги:</span> <span className="font-medium">{item.grade}</span></div>}
        <div><span className="text-muted-foreground">Шагнал:</span> <span className="font-medium text-amber-600">{item.award}</span></div>
        <div><span className="text-muted-foreground">Он:</span> <span className="font-medium tabular-nums">{item.year}</span></div>
        <div><span className="text-muted-foreground">Ангилал:</span> <span className="font-medium">{item.category}</span></div>
      </div>
    );
  }
  if (type === "faq") {
    return (
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Асуулт</div>
          <div className="font-medium">{item.question}</div>
        </div>
        <div className="rounded-lg bg-primary/5 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Хариулт</div>
          <div className="text-muted-foreground">{item.answer}</div>
        </div>
      </div>
    );
  }
  if (type === "event") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Нэр:</span> <span className="font-medium">{item.title}</span></div>
        <div><span className="text-muted-foreground">Огноо:</span> <span className="font-medium tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span></div>
        {item.time && <div><span className="text-muted-foreground">Цаг:</span> <span className="font-medium">{item.time}</span></div>}
        {item.location && <div><span className="text-muted-foreground">Газар:</span> <span className="font-medium">{item.location}</span></div>}
        <div><span className="text-muted-foreground">Тайлбар:</span> <span className="text-muted-foreground">{item.description}</span></div>
        <div><span className="text-muted-foreground">Төрөл:</span> <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{item.type}</span></div>
      </div>
    );
  }
  if (type === "testimonial") {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {item.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.role}</div>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={cn("text-sm", i < item.rating ? "text-amber-400" : "text-muted-foreground/30")}>★</span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 italic text-muted-foreground">"{item.text}"</div>
      </div>
    );
  }
  if (type === "club") {
    return (
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">Нэр:</span> <span className="font-medium">{item.name}</span></div>
        <div><span className="text-muted-foreground">Тайлбар:</span> <span className="text-muted-foreground">{item.description}</span></div>
        {item.teacher && <div><span className="text-muted-foreground">Багш:</span> <span className="font-medium">{item.teacher}</span></div>}
        {item.schedule && <div><span className="text-muted-foreground">Хуваарь:</span> <span className="font-medium">{item.schedule}</span></div>}
        {item.icon && <div><span className="text-muted-foreground">Icon:</span> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.icon}</span></div>}
      </div>
    );
  }
  return <div className="text-sm text-muted-foreground">Мэдээлэл байхгүй</div>;
}

export function SimpleListPanel({ items, type }: { items: any[]; type: string }) {
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState<Record<string, string>>({});

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
        case "achievement": res = await createAchievement({ name: form.name ?? "", grade: form.grade, award: form.award ?? "", year: Number(form.year) || 2025, category: form.category ?? "olimpiad" }); break;
        case "faq": res = await createFaq({ question: form.question ?? "", answer: form.answer ?? "" }); break;
        case "event": res = await createEvent({ title: form.title ?? "", date: form.date ?? new Date().toISOString(), time: form.time, location: form.location, description: form.description ?? "", type: form.type ?? "school" }); break;
        case "testimonial": res = await createTestimonial({ name: form.name ?? "", role: form.role ?? "", text: form.text ?? "", rating: Number(form.rating) || 5 }); break;
        case "club": res = await createClub({ name: form.name ?? "", description: form.description ?? "", teacher: form.teacher, schedule: form.schedule, icon: form.icon }); break;
        default: return;
      }
      if (res?.ok) { toast.success(res.message); setCreateOpen(false); setForm({}); } else toast.error(res?.error);
    });
  };

  const TypeIcon = TYPE_ICONS[type] ?? Megaphone;
  const typeColor = TYPE_COLORS[type] ?? "bg-muted text-muted-foreground";

  return (
    <div>
      {/* Search + Create */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх..." className="pl-9" />
        </div>
        <Button onClick={() => { setForm({}); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" /> Нэмэх
        </Button>
      </div>

      <div className="mb-3 text-xs text-muted-foreground tabular-nums">
        {filtered.length} / {items.length} бичлэг
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={String(item.id)} className="group rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
              {/* Header row — clickable */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex cursor-pointer items-center gap-3 p-4"
              >
                <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColor}`}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{getLabel(item)}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {item.tag && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{item.tag}</span>}
                    {item.year && <span className="tabular-nums">{item.year}</span>}
                    {item.date && <span className="tabular-nums">{new Date(item.date).toLocaleDateString("mn-MN")}</span>}
                    {item.active !== undefined && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", item.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                        {item.active ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                    )}
                    {item.rating && (
                      <span className="text-amber-400">{"★".repeat(item.rating)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setDeleteTarget(item)}
                    disabled={pending}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Устгах"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Expand arrow */}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border/50 bg-muted/20 px-4 py-4">
                  <DetailView item={item} type={type} />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            Мэдээлэл байхгүй
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && !pending && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Шинэ {TITLE_MAP[type]}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {type === "announcement" && <div className="space-y-1.5"><Label>Текст</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>}
            {type === "news" && (<>
              <div className="space-y-1.5"><Label>Таг</Label><Input value={form.tag ?? ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Захиргаа" /></div>
              <div className="space-y-1.5"><Label>Гарчиг</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Товч</Label><Input value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            </>)}
            {type === "tour" && (<>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Дэд нэр</Label><Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="DoorOpen" /></div>
              <div className="space-y-1.5"><Label>360° Зурагны URL</Label><Input value={form.panoramaUrl ?? ""} onChange={(e) => setForm({ ...form, panoramaUrl: e.target.value })} placeholder="https://..." /></div>
            </>)}
            {type === "gallery" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Зурагны URL</Label><Input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-1.5"><Label>Ангилал</Label>
                <Select value={form.category ?? "school"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Анги</Label><Input value={form.grade ?? ""} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="11" /></div>
              <div className="space-y-1.5"><Label>Шагнал</Label><Input value={form.award ?? ""} onChange={(e) => setForm({ ...form, award: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Он</Label><Input type="number" value={form.year ?? "2025"} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Ангилал</Label>
                <Select value={form.category ?? "olimpiad"} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="olimpiad">Олимпиад</SelectItem>
                    <SelectItem value="competition">Тэмцээн</SelectItem>
                    <SelectItem value="academic">Сургалт</SelectItem>
                    <SelectItem value="other">Бусад</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>)}
            {type === "faq" && (<>
              <div className="space-y-1.5"><Label>Асуулт</Label><Input value={form.question ?? ""} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Хариулт</Label><Input value={form.answer ?? ""} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            </>)}
            {type === "event" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Огноо</Label><Input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Цаг</Label><Input value={form.time ?? ""} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="09:00" /></div>
              <div className="space-y-1.5"><Label>Газар</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Төрөл</Label>
                <Select value={form.type ?? "school"} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Хариуцсан</Label><Input value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="3А ангийн ээж" /></div>
              <div className="space-y-1.5"><Label>Сэтгэгдэл</Label><Input value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Үнэлгээ (1-5)</Label><Input type="number" min={1} max={5} value={form.rating ?? "5"} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            </>)}
            {type === "club" && (<>
              <div className="space-y-1.5"><Label>Нэр</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Тайлбар</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Багш</Label><Input value={form.teacher ?? ""} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Хуваарь</Label><Input value={form.schedule ?? ""} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Даваа, Лхагва 16:00" /></div>
              <div className="space-y-1.5"><Label>Icon</Label><Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Dumbbell" /></div>
            </>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={pending}>Болих</Button>
            <Button onClick={handleCreate} disabled={pending}>Үүсгэх</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !pending && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Устгах уу?</DialogTitle>
            <DialogDescription>"{deleteTarget ? getLabel(deleteTarget) : ""}" устгах уу?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>Болих</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>Устгах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
