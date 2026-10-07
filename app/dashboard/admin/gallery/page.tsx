import { Image } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import GalleryPanel from "../GalleryPanel";
import { PageHero } from "../PageHero";

export default async function GalleryPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const gallery = await prisma.galleryImage.findMany({
    orderBy: { order: "asc" },
  });

  const categories = new Set(gallery.map((g) => g.category));

  return (
    <>
      <PageHero
        icon={Image}
        title="Галерей"
        subtitle="Сургуулийн зурагны цомог, ангиллаар зохион байгуулагдсан"
        accent="pink"
        stats={[
          { label: "Зураг", value: gallery.length, tone: "accent" },
          { label: "Ангилал", value: categories.size },
        ]}
      />
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
