import { Image } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";

export default async function GalleryPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const gallery = await prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
          <Image className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Галерей</h1>
          <p className="text-xs text-muted-foreground">Сургуулийн зургууд</p>
        </div>
      </div>
      <SimpleListPanel items={gallery.map((g) => ({ id: g.id, title: g.title, url: g.url, category: g.category, order: g.order }))} type="gallery" />
    </>
  );
}
