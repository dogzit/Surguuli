import { Award } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import { SimpleListPanel } from "../ContentPanel";

export default async function AchievementsPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const achievements = await prisma.achievement.findMany({
    orderBy: { year: "desc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Амжилт</h1>
          <p className="text-xs text-muted-foreground">
            Олимпиад, тэмцээний амжилтууд
          </p>
        </div>
      </div>
      <SimpleListPanel items={achievements.map((a) => ({ id: a.id, name: a.name, grade: a.grade, award: a.award, year: a.year, category: a.category, order: a.order }))} type="achievement" />
    </>
  );
}
