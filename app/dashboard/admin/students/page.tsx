import { Users } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import AdminGate from "../AdminGate";
import StudentsPanel from "../StudentsPanel";
import { getClassroomMeta } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const meta = await getClassroomMeta();
  if (!meta.ok) return <AdminGate />;

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Сурагчид</h1>
          <p className="text-xs text-muted-foreground">
            Ангиудын сурагчийн бүртгэл, Excel импорт, шинэ бүлэг үүсгэх
          </p>
        </div>
      </div>
      <StudentsPanel classroomMeta={meta.data!} />
    </>
  );
}
