import { Image } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import GalleryPanel from "../GalleryPanel";

export default async function GalleryPage() {
  const access = await canAccessAdmin();
  if (!access.allowed) return <AdminGate />;

  const gallery = await prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 text-pink-500">
          <Image className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Галерей</h1>
          <p className="text-xs text-muted-foreground">
            Сургуулийн зургууд · {gallery.length} зураг
          </p>
        </div>
      </div>
      <GalleryPanel
        images={gallery.map((g) => ({
          id: g.id,
          title: g.title,
          url: g.url,
          category: g.category,
          order: g.order,
        }))}
      />
    </>
  );
}
