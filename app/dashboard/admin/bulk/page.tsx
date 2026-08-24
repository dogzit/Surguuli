import { Wrench } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AdminGate from "../AdminGate";
import BulkPanel from "../BulkPanel";

export default async function BulkPage() {
  if (!(await isAdmin())) return <AdminGate />;

  const [userCount, signatureCount] = await Promise.all([
    prisma.user.count(),
    prisma.signature.count(),
  ]);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Үйлдлүүд</h1>
          <p className="text-xs text-muted-foreground">
            масс үйлдлүүд, тохиргоо
          </p>
        </div>
      </div>
      <BulkPanel signatureCount={signatureCount} userCount={userCount} />
    </>
  );
}
