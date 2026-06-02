import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import UserPicker from "./UserPicker";

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) {
    redirect(me.role === "APPROVER" ? "/dashboard/approver" : "/dashboard/teacher");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, role: true },
  });
  const teachers = users.filter((u) => u.role === "TEACHER");
  const approvers = users.filter((u) => u.role === "APPROVER");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Амралтын олговрын баталгаажуулалт
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Нэрээ сонгоод PIN кодоо оруулна уу. Анхны PIN бүгдэд адил{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              0000
            </code>
            .
          </p>
        </div>
      </div>

      <UserPicker teachers={teachers} approvers={approvers} />
    </main>
  );
}
