import { Award } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";
import { PageHero } from "../PageHero";

export default async function AchievementsPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const achievements = await prisma.achievement.findMany({
    orderBy: { year: "desc" },
  });

  const years = new Set(achievements.map((a) => a.year));
  const latestYear = achievements[0]?.year;

  return (
    <>
      <PageHero
        icon={Award}
        title="Амжилт"
        subtitle="Олимпиад, тэмцээн, шагналын бүртгэл"
        accent="amber"
        stats={[
          { label: "Нийт амжилт", value: achievements.length, tone: "accent" },
          { label: "Он", value: years.size },
          ...(latestYear ? [{ label: "Сүүлийн", value: latestYear } as const] : []),
        ]}
      />
      <SimpleListPanel items={achievements.map((a) => ({ id: a.id, name: a.name, grade: a.grade, award: a.award, year: a.year, category: a.category, order: a.order }))} type="achievement" />
    </>
  );
}
