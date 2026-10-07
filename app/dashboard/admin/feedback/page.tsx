import { MessageSquareHeart } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { PageHero } from "../PageHero";
import { FeedbackInbox, type FeedbackItem } from "./FeedbackInbox";

export default async function FeedbackAdminPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const items: FeedbackItem[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    topic: r.topic,
    title: r.title,
    body: r.body,
    anonymous: r.anonymous,
    actorKind: r.actorKind,
    name: r.name,
    contact: r.contact,
    status: r.status,
    adminNote: r.adminNote,
    response: r.response,
    respondedAt: r.respondedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const count = (status: string) => rows.filter((r) => r.status === status).length;

  return (
    <>
      <PageHero
        icon={MessageSquareHeart}
        title="Санал хүсэлт"
        subtitle="Сурагч, эцэг эх, багш, олон нийтээс ирсэн санал, хүсэлт, гомдол"
        accent="emerald"
        stats={[
          { label: "Шинэ", value: count("new"), tone: "accent" },
          { label: "Хянаж байна", value: count("in_review") },
          { label: "Шийдвэрлэсэн", value: count("resolved") },
          { label: "Нийт", value: rows.length, tone: "muted" },
        ]}
      />
      <FeedbackInbox items={items} />
    </>
  );
}
