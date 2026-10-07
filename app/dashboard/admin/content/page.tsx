import { Megaphone, Newspaper, MapPin } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleListPanel } from "../ContentPanel";
import { PageHero } from "../PageHero";

export default async function ContentPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const [announcements, newsItems, tourRooms] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { order: "asc" } }),
    prisma.newsItem.findMany({ orderBy: { order: "asc" } }),
    prisma.tourRoom.findMany({ orderBy: { order: "asc" } }),
  ]);

  const activeAnnouncements = announcements.filter((a) => a.active).length;

  return (
    <>
      <PageHero
        icon={Newspaper}
        title="Контент"
        subtitle="Зарлал, мэдээ, виртуал аялалын удирдлага"
        accent="violet"
        stats={[
          { label: "Зарлал", value: announcements.length, tone: "accent" },
          { label: "Идэвхтэй", value: activeAnnouncements },
          { label: "Мэдээ", value: newsItems.length },
          { label: "Зогсолол", value: tourRooms.length },
        ]}
      />
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
          <SimpleListPanel items={newsItems.map((n) => ({
            id: n.id,
            tag: n.tag,
            title: n.title,
            excerpt: n.excerpt,
            body: n.body,
            coverImage: n.coverImage,
            slug: n.slug,
            status: n.status,
            date: n.date.toISOString(),
            order: n.order,
          }))} type="news" />
        </TabsContent>
        <TabsContent value="tour" className="mt-4">
          <SimpleListPanel items={tourRooms.map((r) => ({ id: r.id, slug: r.slug, label: r.label, subtitle: r.subtitle, description: r.description, icon: r.icon, order: r.order }))} type="tour" />
        </TabsContent>
      </Tabs>
    </>
  );
}
