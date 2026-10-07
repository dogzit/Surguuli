import { Trophy } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import PortfolioModerationPanel, { type PortfolioRow } from "../PortfolioModerationPanel";

export const dynamic = "force-dynamic";

export default async function PortfolioModerationPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const items = await prisma.studentPortfolioItem.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 500,
    include: {
      student: {
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          classroom: { select: { label: true } },
        },
      },
    },
  });

  const pending = items.filter((i) => i.status === "pending").length;
  const approved = items.filter((i) => i.status === "approved").length;
  const rejected = items.filter((i) => i.status === "rejected").length;
  const published = items.filter((i) => i.publishedToGallery).length;

  const rows: PortfolioRow[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    category: i.category,
    description: i.description,
    imageUrl: i.imageUrl,
    achievedAt: i.achievedAt ? i.achievedAt.toISOString() : null,
    status: i.status,
    reviewNote: i.reviewNote,
    publishedToGallery: i.publishedToGallery,
    createdAt: i.createdAt.toISOString(),
    student: {
      id: i.student.id,
      code: i.student.code,
      name: `${i.student.lastName}. ${i.student.firstName}`,
      classroom: i.student.classroom.label,
    },
  }));

  return (
    <>
      <PageHero
        icon={Trophy}
        title="Сурагчийн ажлын шүүлт"
        subtitle="Сурагчдын өөрсдийнхөө илгээсэн амжилт, гэрчилгээг шүүж, олон нийтэд ил болгох"
        accent="amber"
        stats={[
          { label: "Хүлээгдэж буй", value: pending, tone: "accent" },
          { label: "Батлагдсан", value: approved },
          { label: "Гал зурагт нийтэлсэн", value: published },
          { label: "Татгалзсан", value: rejected, tone: "muted" },
        ]}
      />
      <PortfolioModerationPanel items={rows} />
    </>
  );
}
