import { Users as UsersIcon } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import UsersPanel from "../UsersPanel";

export default async function UsersPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      role: true,
      _count: { select: { managedSignatures: true, signatures: true } },
    },
  });

  const clientUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    position: u.position,
    role: u.role,
    signedCount: u._count.signatures,
    receivedCount: u._count.managedSignatures,
  }));

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Хэрэглэгчид</h1>
          <p className="text-xs text-muted-foreground">
            Бүх багш, баталгаажуулагч, админууд
          </p>
        </div>
      </div>
      <UsersPanel users={clientUsers} />
    </>
  );
}
