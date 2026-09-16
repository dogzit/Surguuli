import { KeyRound } from "lucide-react";
import { canAccessAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import CodesPanel from "./CodesPanel";

export const dynamic = "force-dynamic";

export default async function TeacherCodesPage() {
  const access = await canAccessAdmin();
  if (access.role !== "ADMIN") return <AdminGate role={access.role as "APPROVER" | null} />;

  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: [{ role: "asc" }, { position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, role: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PIN кодууд</h1>
          <p className="text-xs text-muted-foreground">
            PIN нь bcrypt hash-аар хадгалагдана. Reset дарж шинэ PIN үүсгэвэл нэг л удаа харагдана.
          </p>
        </div>
      </div>
      <CodesPanel users={users} />
    </div>
  );
}
