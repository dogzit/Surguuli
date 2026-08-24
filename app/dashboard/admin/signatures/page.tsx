import { FileSignature } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import SignaturesPanel from "../SignaturesPanel";

export default async function SignaturesPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const signatures = await prisma.signature.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true, position: true } },
      approver: { select: { id: true, name: true, position: true } },
    },
  });

  const clientSignatures = signatures.map((s) => ({
    id: s.id,
    note: s.note,
    createdAt: s.createdAt.toISOString(),
    teacher: s.teacher,
    approver: s.approver,
  }));

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <FileSignature className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Гарын үсэг</h1>
          <p className="text-xs text-muted-foreground">
            Бүх баталгаажуулалтын түүх
          </p>
        </div>
      </div>
      <SignaturesPanel signatures={clientSignatures} />
    </>
  );
}
