import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ACCOUNTANT_POSITION, APPROVER_POSITIONS } from "@/lib/positions";
import OverviewPanel, { type OverviewRow } from "../admin/OverviewPanel";
import { Button } from "@/components/ui/button";

export default async function AccountantDashboard() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "APPROVER" || me.position !== ACCOUNTANT_POSITION) {
    redirect("/dashboard");
  }

  const [teacherUsers, signatures] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, position: true },
    }),
    prisma.signature.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        teacherId: true,
        createdAt: true,
        approver: { select: { name: true, position: true } },
      },
    }),
  ]);

  const validPos = new Set<string>(APPROVER_POSITIONS);
  const totalPositions = APPROVER_POSITIONS.length;

  type Agg = {
    signed: Set<string>;
    lastAt: Date | null;
    lastApprover: string | null;
  };
  const sigByTeacher = new Map<string, Agg>();
  for (const s of signatures) {
    if (!validPos.has(s.approver.position)) continue;
    const agg = sigByTeacher.get(s.teacherId) ?? {
      signed: new Set<string>(),
      lastAt: null,
      lastApprover: null,
    };
    agg.signed.add(s.approver.position);
    if (!agg.lastAt || s.createdAt > agg.lastAt) {
      agg.lastAt = s.createdAt;
      agg.lastApprover = s.approver.name;
    }
    sigByTeacher.set(s.teacherId, agg);
  }

  const overviewRows: OverviewRow[] = teacherUsers
    .map((t) => {
      const agg = sigByTeacher.get(t.id);
      const signedSet = agg?.signed ?? new Set<string>();
      const signedPositions = APPROVER_POSITIONS.filter((p) =>
        signedSet.has(p),
      );
      const missingPositions = APPROVER_POSITIONS.filter(
        (p) => !signedSet.has(p),
      );
      return {
        id: t.id,
        name: t.name,
        position: t.position,
        signed: signedSet.size,
        total: totalPositions,
        complete: signedSet.size >= totalPositions,
        signedPositions: [...signedPositions],
        missingPositions: [...missingPositions],
        lastSignedAt: agg?.lastAt ? agg.lastAt.toISOString() : null,
        lastApproverName: agg?.lastApprover ?? null,
      };
    })
    .sort((a, b) => {
      const aGroup = a.complete ? 1 : a.signed === 0 ? 2 : 0;
      const bGroup = b.complete ? 1 : b.signed === 0 ? 2 : 0;
      if (aGroup !== bGroup) return aGroup - bGroup;
      if (aGroup === 0) {
        const at = a.lastSignedAt ? new Date(a.lastSignedAt).getTime() : 0;
        const bt = b.lastSignedAt ? new Date(b.lastSignedAt).getTime() : 0;
        return bt - at;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {me.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {me.position} · Нэгдсэн дүн
            </p>
          </div>
        </div>
        <Link href="/dashboard/approver">
          <Button variant="outline" size="sm">
            <FileSignature className="mr-2 h-4 w-4" />
            Гарын үсэг зурах
          </Button>
        </Link>
      </header>

      <OverviewPanel rows={overviewRows} />
    </main>
  );
}
