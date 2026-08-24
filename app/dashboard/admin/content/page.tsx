import { Megaphone, Newspaper, MapPin } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleListPanel } from "../ContentPanel";

export default async function ContentPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const [announcements, newsItems, tourRooms] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { order: "asc" } }),
    prisma.newsItem.findMany({ orderBy: { order: "asc" } }),
    prisma.tourRoom.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
          <Newspaper className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Контент</h1>
          <p className="text-xs text-muted-foreground">
            Зарлал, мэдээ, виртуал аялал
          </p>
        </div>
      </div>
      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:max-w-lg">
          <TabsTrigger value="announcements">
            <Megaphone className="mr-1 h-3 w-3" /> Зарлал
          </TabsTrigger>
          <TabsTrigger value="news">
            <Newspaper className="mr-1 h-3 w-3" /> Мэдээ
          </TabsTrigger>
          <TabsTrigger value="tour">
            <MapPin className="mr-1 h-3 w-3" /> Аялал
          </TabsTrigger>
        </TabsList>
        <TabsContent value="announcements" className="mt-4">
          <SimpleListPanel items={announcements.map((a) => ({ id: a.id, text: a.text, order: a.order, active: a.active }))} type="announcement" />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <SimpleListPanel items={newsItems.map((n) => ({ id: n.id, tag: n.tag, title: n.title, excerpt: n.excerpt, date: n.date.toISOString(), order: n.order }))} type="news" />
        </TabsContent>
        <TabsContent value="tour" className="mt-4">
          <SimpleListPanel items={tourRooms.map((r) => ({ id: r.id, slug: r.slug, label: r.label, subtitle: r.subtitle, description: r.description, icon: r.icon, order: r.order }))} type="tour" />
        </TabsContent>
      </Tabs>
    </>
  );
}
